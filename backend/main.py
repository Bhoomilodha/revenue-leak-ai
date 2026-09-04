from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import math
from datetime import datetime
from typing import List, Optional
from backend.database import get_db_connection, init_db, seed_db
from backend.recovery_engine import analyze_transaction, validate_policies, process_recovery_workflow

import os

# Ensure DB is initialized and seeded
init_db()
seed_db()

app = FastAPI(title="RevenueLeak AI - API")

# Production-minded CORS configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if "*" not in CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PolicyUpdate(BaseModel):
    max_retries: int
    min_confidence: float
    reminder_cooldown_hours: int
    high_value_threshold: float
    auto_action_enabled: bool

@app.on_event("startup")
def pre_score_unscored_transactions():
    """
    On startup, pre-score all transactions that have 0.0 recovery_probability.
    This ensures our synthetic dashboard displays correct values immediately.
    """
    print("Pre-scoring transactions using the AI model...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM transactions WHERE recovery_probability = 0.0")
    rows = cursor.fetchall()
    
    if rows:
        print(f"Scoring {len(rows)} unscored transactions...")
        for row in rows:
            txn = dict(row)
            analysis = analyze_transaction(txn)
            cursor.execute("""
                UPDATE transactions
                SET recovery_probability = ?,
                    priority_score = ?,
                    expected_recovery_value = ?,
                    recommended_action = ?,
                    confidence = ?,
                    policy_status = 'pending'
                WHERE id = ?
            """, (
                analysis["recovery_probability"],
                analysis["priority_score"],
                analysis["expected_recovery_value"],
                analysis["recommended_action"],
                analysis["confidence"],
                txn["id"]
            ))
        conn.commit()
        print("Scoring complete.")
    else:
        print("All transactions already scored.")
        
    conn.close()

# ----------------- ENDPOINTS -----------------

@app.get("/api/stats")
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Calculate overview stats
    cursor.execute("""
        SELECT 
            COALESCE(SUM(amount), 0) as total_at_risk,
            COUNT(*) as total_cases
        FROM transactions 
        WHERE status != 'recovered'
    """)
    at_risk_row = cursor.fetchone()
    at_risk = round(at_risk_row['total_at_risk'], 2)
    
    cursor.execute("""
        SELECT 
            COALESCE(SUM(amount), 0) as total_recovered
        FROM transactions 
        WHERE status = 'recovered'
    """)
    recovered_row = cursor.fetchone()
    recovered = round(recovered_row['total_recovered'], 2)
    
    total = recovered + at_risk
    recovery_rate = round((recovered / total * 100.0), 1) if total > 0 else 0.0
    
    # Sum of expected recovery value for unresolved cases
    cursor.execute("""
        SELECT 
            COALESCE(SUM(expected_recovery_value), 0) as total_expected
        FROM transactions
        WHERE status != 'recovered'
    """)
    expected_val = round(cursor.fetchone()['total_expected'], 2)
    
    # High Priority Leaks (top 5 unresolved)
    cursor.execute("""
        SELECT id, leak_type, amount, recovery_probability, priority_score, recommended_action, status
        FROM transactions
        WHERE status != 'recovered'
        ORDER BY priority_score DESC
        LIMIT 5
    """)
    high_priority = [dict(r) for r in cursor.fetchall()]
    
    # Minimal activity feed (last 8 audit logs)
    cursor.execute("""
        SELECT timestamp, event_type, details, transaction_id
        FROM audit_logs
        ORDER BY id DESC
        LIMIT 8
    """)
    activity = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    return {
        "revenue_at_risk": at_risk,
        "revenue_recovered": recovered,
        "recovery_rate": recovery_rate,
        "expected_recovery_value": expected_val,
        "high_priority_leaks": high_priority,
        "activity_feed": activity
    }

@app.get("/api/leak-map")
def get_leak_map():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    leak_categories = {
        'payment_failure': 'Payment Processing',
        'checkout_abandonment': 'Checkout',
        'failed_subscription': 'Subscriptions',
        'overdue_invoice': 'Receivables'
    }
    
    results = {}
    for leak_type, display_name in leak_categories.items():
        cursor.execute("""
            SELECT 
                COALESCE(SUM(amount), 0) as at_risk,
                COALESCE(AVG(recovery_probability), 0) as avg_prob,
                COALESCE(AVG(priority_score), 0) as avg_priority,
                COALESCE(SUM(expected_recovery_value), 0) as expected_value,
                COUNT(*) as count
            FROM transactions
            WHERE leak_type = ? AND status != 'recovered'
        """, (leak_type,))
        row = cursor.fetchone()
        results[leak_type] = {
            "name": display_name,
            "amount_at_risk": round(row['at_risk'], 2),
            "recoverability": round(row['avg_prob'] * 100, 1),
            "priority_score": round(row['avg_priority'], 1),
            "expected_recovery_value": round(row['expected_value'], 2),
            "affected_cases": row['count']
        }
        
    conn.close()
    return results

@app.get("/api/leak-map/detail")
def get_leak_map_detail(leak_type: str = Query(...)):
    if leak_type not in ['payment_failure', 'checkout_abandonment', 'failed_subscription', 'overdue_invoice']:
        raise HTTPException(status_code=400, detail="Invalid leak type")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Why Prioritized summary
    cursor.execute("""
        SELECT 
            AVG(recovery_probability) as avg_prob,
            AVG(priority_score) as avg_priority,
            SUM(amount) as sum_amt
        FROM transactions
        WHERE leak_type = ? AND status != 'recovered'
    """, (leak_type,))
    summary = cursor.fetchone()
    avg_p = summary['avg_priority'] or 0
    avg_prob = summary['avg_prob'] or 0
    sum_amt = summary['sum_amt'] or 0
    
    why_summary = (
        f"This category exhibits a priority index of {avg_p:.1f} with average recoverability at {avg_prob:.0%}. "
        f"A total of ₹{sum_amt:,.2f} is currently outstanding, which is a prime target for automated outreach."
    )
    
    # 2. Top 5 transactions
    cursor.execute("""
        SELECT id, amount, recovery_probability, priority_score, recommended_action, status
        FROM transactions
        WHERE leak_type = ? AND status != 'recovered'
        ORDER BY priority_score DESC
        LIMIT 5
    """, (leak_type,))
    top_cases = [dict(r) for r in cursor.fetchall()]
    
    # 3. Probability distribution (buckets)
    cursor.execute("""
        SELECT recovery_probability FROM transactions 
        WHERE leak_type = ? AND status != 'recovered'
    """, (leak_type,))
    probs = [r[0] for r in cursor.fetchall()]
    
    buckets = {"0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0}
    for p in probs:
        if p < 0.2: buckets["0-20%"] += 1
        elif p < 0.4: buckets["20-40%"] += 1
        elif p < 0.6: buckets["40-60%"] += 1
        elif p < 0.8: buckets["60-80%"] += 1
        else: buckets["80-100%"] += 1
        
    # 4. Recommended strategies counts
    cursor.execute("""
        SELECT recommended_action, COUNT(*) as count 
        FROM transactions
        WHERE leak_type = ? AND status != 'recovered'
        GROUP BY recommended_action
    """, (leak_type,))
    strategies = {r['recommended_action']: r['count'] for r in cursor.fetchall()}
    
    conn.close()
    
    return {
        "why_prioritized": why_summary,
        "top_transactions": top_cases,
        "distribution": [{"bucket": k, "count": v} for k, v in buckets.items()],
        "strategies": [{"action": k.replace('_', ' ').title(), "count": v} for k, v in strategies.items()]
    }

@app.get("/api/queue")
def get_queue(
    leak_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM transactions WHERE 1=1"
    params = []
    
    if leak_type:
        query += " AND leak_type = ?"
        params.append(leak_type)
    if status:
        if status == "unresolved":
            query += " AND status != 'recovered'"
        else:
            query += " AND status = ?"
            params.append(status)
            
    if search:
        query += " AND (id LIKE ? OR customer_id LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")
        
    query += " ORDER BY priority_score DESC"
    
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

# ----------------- AI LAB STEPPER -----------------

@app.get("/api/lab/reset")
def reset_lab_transaction(txn_id: str = Query(...)):
    """
    Resets a transaction back to failed and clears retries so the user can analyze it.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE transactions
        SET status = 'failed',
            retry_count = 0,
            policy_status = 'pending',
            blocked_reason = ''
        WHERE id = ?
    """, (txn_id,))
    
    # Add a reset log
    cursor.execute("""
        INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
        VALUES (?, ?, ?, ?)
    """, (txn_id, datetime.utcnow().isoformat(), "LAB_RESET", "Transaction reset in AI Lab for testing."))
    
    conn.commit()
    
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (txn_id,))
    txn = dict(cursor.fetchone())
    conn.close()
    return txn

@app.get("/api/lab/analyze")
def lab_analyze(txn_id: str = Query(...)):
    """
    Step-by-step: Fetches transaction features and runs AI Scorer.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (txn_id,))
    txn_row = cursor.fetchone()
    conn.close()
    
    if not txn_row:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    txn = dict(txn_row)
    analysis = analyze_transaction(txn)
    
    return {
        "transaction": txn,
        "analysis": analysis
    }

@app.get("/api/lab/policy-check")
def lab_policy_check(txn_id: str = Query(...)):
    """
    Step-by-step: Runs Policy validation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (txn_id,))
    txn = dict(cursor.fetchone())
    
    cursor.execute("SELECT * FROM policies WHERE id = 1")
    policy = dict(cursor.fetchone())
    
    conn.close()
    
    analysis = analyze_transaction(txn)
    is_approved, block_reason = validate_policies(txn, analysis, policy)
    
    return {
        "is_approved": is_approved,
        "block_reason": block_reason,
        "policy": policy,
        "analysis": analysis
    }

@app.post("/api/lab/execute")
def lab_execute(txn_id: str = Body(..., embed=True)):
    """
    Step-by-step: Executes the recovery simulator.
    """
    result = process_recovery_workflow(txn_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

# ----------------- POLICIES -----------------

@app.get("/api/policies")
def get_policies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM policies WHERE id = 1")
    row = cursor.fetchone()
    
    # Get count of blocked transactions
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE policy_status = 'blocked'")
    blocked_count = cursor.fetchone()[0]
    
    # Get last 5 blocked cases
    cursor.execute("""
        SELECT id, leak_type, amount, blocked_reason, last_action_time
        FROM transactions
        WHERE policy_status = 'blocked'
        ORDER BY last_action_time DESC
        LIMIT 5
    """)
    blocked_cases = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    
    policy_dict = dict(row)
    # Convert sqlite integer boolean to json boolean
    policy_dict["auto_action_enabled"] = bool(policy_dict["auto_action_enabled"])
    
    return {
        "policy": policy_dict,
        "blocked_count": blocked_count,
        "blocked_cases": blocked_cases
    }

@app.put("/api/policies")
def update_policies(update: PolicyUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE policies
        SET max_retries = ?,
            min_confidence = ?,
            reminder_cooldown_hours = ?,
            high_value_threshold = ?,
            auto_action_enabled = ?
        WHERE id = 1
    """, (
        update.max_retries,
        update.min_confidence,
        update.reminder_cooldown_hours,
        update.high_value_threshold,
        1 if update.auto_action_enabled else 0
    ))
    conn.commit()
    conn.close()
    return {"message": "Policy updated successfully"}

# ----------------- AUDIT TRAIL -----------------

@app.get("/api/audit")
def get_audit(limit: int = 100):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM audit_logs
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

# ----------------- BATCH SIMULATION -----------------

@app.post("/api/batch-simulate")
def run_batch_simulate(count: int = Body(..., embed=True)):
    """
    Selects N unresolved transactions, processes them through the Recovery Engine,
    and returns a summary of the Before vs After stats.
    """
    if count not in [25, 50, 100, 250]:
        raise HTTPException(status_code=400, detail="Count must be 25, 50, 100, or 250")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Select N transactions deterministically (ordered by id) and record baseline
    cursor.execute("""
        SELECT id, amount, expected_recovery_value FROM transactions 
        WHERE status != 'recovered' AND status != 'stopped'
        ORDER BY id ASC
        LIMIT ?
    """, (count,))
    batch_rows = cursor.fetchall()
    txn_ids = [r[0] for r in batch_rows]
    batch_revenue_at_risk = sum(r[1] for r in batch_rows)
    batch_expected_recovery = sum(r[2] for r in batch_rows)
    
    conn.close()
    
    # 2. Run recovery workflow on each transaction in the batch
    outcomes = []
    for txn_id in txn_ids:
        res = process_recovery_workflow(txn_id)
        outcomes.append(res)
        
    # 3. Capture AFTER stats specifically for this selected batch
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if txn_ids:
        placeholders = ",".join("?" for _ in txn_ids)
        cursor.execute(f"""
            SELECT id, amount, status FROM transactions 
            WHERE id IN ({placeholders})
        """, txn_ids)
        processed_txns = cursor.fetchall()
    else:
        processed_txns = []
        
    conn.close()
    
    batch_recovered_amt = sum(r[1] for r in processed_txns if r[2] == 'recovered')
    batch_recovered_cnt = sum(1 for r in processed_txns if r[2] == 'recovered')
    batch_failed_cnt = sum(1 for r in processed_txns if r[2] in ('failed_attempt', 'failed', 'unresolved'))
    batch_blocked_cnt = sum(1 for r in processed_txns if r[2] == 'blocked_by_policy')
    batch_escalated_cnt = sum(1 for r in processed_txns if r[2] == 'escalated_to_human')
    batch_recovery_rate = round((batch_recovered_amt / batch_revenue_at_risk * 100.0), 1) if batch_revenue_at_risk > 0 else 0.0
    
    return {
        "batch_size": count,
        "processed_count": len(txn_ids),
        "batch_revenue_at_risk": round(batch_revenue_at_risk, 2),
        "batch_expected_recovery": round(batch_expected_recovery, 2),
        "batch_recovered_amount": round(batch_recovered_amt, 2),
        "batch_recovered_count": batch_recovered_cnt,
        "batch_failed_count": batch_failed_cnt,
        "batch_blocked_count": batch_blocked_cnt,
        "batch_escalated_count": batch_escalated_cnt,
        "batch_recovery_rate": batch_recovery_rate,
        "before": {
            "recovered_value": 0.0,
            "recovered_count": 0,
            "recovery_rate": 0.0,
            "at_risk_value": round(batch_revenue_at_risk, 2)
        },
        "after": {
            "recovered_value": round(batch_recovered_amt, 2),
            "recovered_count": batch_recovered_cnt,
            "recovery_rate": batch_recovery_rate,
            "at_risk_value": round(max(0, batch_revenue_at_risk - batch_recovered_amt), 2)
        },
        "metrics": {
            "recovered_amount_delta": round(batch_recovered_amt, 2),
            "manual_interventions": batch_escalated_cnt,
            "blocked_actions": batch_blocked_cnt,
            "unresolved_cases": batch_failed_cnt
        },
        "outcomes": outcomes
    }

@app.post("/api/db/reset")
def reset_database():
    """
    Resets the database back to its initial seeded state with seed 42.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Clear all
        cursor.execute("DROP TABLE IF EXISTS transactions")
        cursor.execute("DROP TABLE IF EXISTS policies")
        cursor.execute("DROP TABLE IF EXISTS audit_logs")
        conn.commit()
        conn.close()
        
        # Re-initialize and seed
        init_db()
        seed_db()
        
        # Pre-score
        pre_score_unscored_transactions()
        
        return {"message": "Database reset to seeded state successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")

