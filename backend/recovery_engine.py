import sqlite3
import random
from datetime import datetime
from backend.database import get_db_connection
from backend.ai_engine import RecoveryScorer

scorer = RecoveryScorer()

def analyze_transaction(txn):
    """
    Analyzes a transaction dictionary:
    - Calls AI model to predict recovery probability.
    - Calculates priority score and expected recovery value.
    - Determines recommended recovery strategy.
    - Computes a confidence score.
    Returns analysis structured output.
    """
    amount = txn['amount']
    customer_success_rate = txn['customer_success_rate']
    previous_transaction_count = txn['previous_transaction_count']
    retry_count = txn['retry_count']
    leak_type = txn['leak_type']
    payment_method = txn['payment_method']
    failure_reason = txn['failure_reason']
    
    # Run the AI model probability prediction
    probability = scorer.predict_probability(txn)
    
    # Calculate Priority and Expected Recovery Value
    priority_score, expected_value = scorer.calculate_priority_and_expected_value(
        amount, probability, retry_count
    )
    
    # Calculate behavioral confidence score (out of 1.0)
    confidence = round(0.70 + 0.25 * customer_success_rate + (0.05 if previous_transaction_count > 10 else 0.0), 2)
    confidence = max(0.50, min(0.99, confidence)) # clamp between 50% and 99%
    
    # Determine the recommended strategy
    recommended_action = "none"
    reason_summary = ""
    
    if probability < 0.25:
        recommended_action = "stop_automated_recovery"
        reason_summary = "Recovery probability is extremely low based on past history. Stop automation to prevent customer friction."
    elif leak_type == "payment_failure":
        if failure_reason in ["insufficient_funds", "bank_downtime"]:
            if retry_count == 0:
                recommended_action = "retry_after_delay"
                reason_summary = "Temporary failure reason detected. Cooldown recommended before attempting automatic retry."
            elif retry_count == 1:
                recommended_action = "suggest_alternative_payment"
                reason_summary = "Repeated temporary failures. Recommending switching to an alternative payment method."
            else:
                recommended_action = "human_escalation"
                reason_summary = "Retry threshold exceeded for payment failure. Manual customer service intervention needed."
        elif failure_reason == "network_timeout":
            if retry_count == 0:
                recommended_action = "retry_immediately"
                reason_summary = "Transient network timeout detected. Immediate automatic retry is highly likely to succeed."
            else:
                recommended_action = "retry_after_delay"
                reason_summary = "Secondary timeout detected. Recommending retry after system cooldown."
        else: # e.g. authentication_failed
            recommended_action = "suggest_alternative_payment"
            reason_summary = "Authentication failed. Suggesting alternative payment method (e.g. UPI/Card update)."
            
    elif leak_type == "checkout_abandonment":
        if customer_success_rate > 0.8:
            recommended_action = "personalized_reminder"
            reason_summary = "Checkout abandoned by high-value customer. Personalized cart reminder is recommended."
        else:
            recommended_action = "payment_link_follow_up"
            reason_summary = "Checkout abandoned. Follow up with a direct recovery checkout link."
            
    elif leak_type == "failed_subscription":
        if failure_reason == "card_expired":
            recommended_action = "personalized_reminder"
            reason_summary = "Subscription failed due to expired card. Prompting user to update billing details."
        elif retry_count == 0:
            recommended_action = "retry_after_delay"
            reason_summary = "Subscription renewal failed. Scheduling automated retry after delay."
        else:
            recommended_action = "payment_link_follow_up"
            reason_summary = "Subscription failed repeatedly. Dispatching direct payment link to renew subscription."
            
    elif leak_type == "overdue_invoice":
        if amount > 20000.0:
            recommended_action = "human_escalation"
            reason_summary = "High-value invoice is overdue. Recommend manual sales/escalation follow-up."
        else:
            recommended_action = "payment_link_follow_up"
            reason_summary = "Invoice overdue. Re-sending structured invoice payment link."
            
    return {
        "leak_type": leak_type,
        "recovery_probability": probability,
        "priority_score": priority_score,
        "expected_recovery_value": expected_value,
        "recommended_action": recommended_action,
        "reason_summary": reason_summary,
        "confidence": confidence
    }

def validate_policies(txn, analysis, policy):
    """
    Checks policies and guardrails against transaction and recommended action.
    Returns (is_approved, block_reason)
    """
    action = analysis["recommended_action"]
    
    # If the action is to escalate to human or stop, it doesn't represent automated recovery
    if action in ["human_escalation", "stop_automated_recovery", "none"]:
        return True, ""
        
    # Check 1: Auto Action Enabled Globally
    if not policy["auto_action_enabled"]:
        return False, "Automated actions are globally disabled by merchant settings."
        
    # Check 2: Max Automatic Retries
    if action in ["retry_immediately", "retry_after_delay"]:
        if txn["retry_count"] >= policy["max_retries"]:
            return False, f"Maximum automatic retry limit ({policy['max_retries']}) exceeded."
            
    # Check 3: Minimum Decision Confidence
    if analysis["confidence"] < policy["min_confidence"]:
        return False, f"Decision confidence ({analysis['confidence']:.0%}) below policy minimum ({policy['min_confidence']:.0%})."
        
    # Check 4: High Value Threshold
    if txn["amount"] >= policy["high_value_threshold"]:
        return False, f"Transaction amount (₹{txn['amount']:,.2f}) exceeds high-value threshold (₹{policy['high_value_threshold']:,.2f}), requiring manual approval."
        
    # Check 5: Reminder Cooldown Enforcement
    if action in ["personalized_reminder", "payment_link_follow_up"] and txn.get("last_action_time"):
        try:
            last_time_str = str(txn["last_action_time"])
            if "T" in last_time_str:
                last_time = datetime.fromisoformat(last_time_str.replace("Z", ""))
            else:
                last_time = datetime.strptime(last_time_str.split(".")[0], "%Y-%m-%d %H:%M:%S")
            hours_elapsed = (datetime.utcnow() - last_time).total_seconds() / 3600.0
            cooldown_hours = policy.get("reminder_cooldown_hours", 24)
            if hours_elapsed < cooldown_hours:
                return False, f"Reminder cooldown active: {hours_elapsed:.1f}h elapsed of required {cooldown_hours}h cooldown window."
        except Exception:
            pass

    return True, ""

def process_recovery_workflow(txn_id):
    """
    Executes the full recovery orchestrator workflow:
    1. Fetches transaction.
    2. Feeds AI analysis.
    3. Runs Policy validation.
    4. Simulates execution outcome.
    5. Updates DB and inserts Audit logs.
    Returns dict representing step-by-step history and outcome.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch transaction
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (txn_id,))
    txn_row = cursor.fetchone()
    if not txn_row:
        conn.close()
        return {"error": "Transaction not found"}
        
    txn = dict(txn_row)
    
    # Fetch active policy
    cursor.execute("SELECT * FROM policies WHERE id = 1")
    policy_row = cursor.fetchone()
    policy = dict(policy_row) if policy_row else {
        "max_retries": 2, "min_confidence": 0.70, "reminder_cooldown_hours": 24, "high_value_threshold": 10000.0, "auto_action_enabled": 1
    }
    
    steps = []
    timestamp = datetime.utcnow().isoformat()
    
    steps.append({"stage": "leak_detected", "message": f"Revenue leak of type '{txn['leak_type']}' (₹{txn['amount']:,.2f}) detected."})
    
    # 2. AI Analysis
    analysis = analyze_transaction(txn)
    steps.append({
        "stage": "ai_analyzed",
        "message": f"AI analysis completed. Probability: {analysis['recovery_probability']:.0%}, Expected Value: ₹{analysis['expected_recovery_value']:,.2f}, Priority: {analysis['priority_score']:.0f}."
    })
    steps.append({
        "stage": "strategy_selected",
        "message": f"Strategy recommended: {analysis['recommended_action'].replace('_', ' ').title()}. Reason: {analysis['reason_summary']}"
    })
    
    # 3. Policy Engine Validation
    is_approved, block_reason = validate_policies(txn, analysis, policy)
    
    status_before = txn["status"]
    new_status = txn["status"]
    new_policy_status = "approved" if is_approved else "blocked"
    new_blocked_reason = block_reason
    new_retry_count = txn["retry_count"]
    
    if not is_approved:
        steps.append({
            "stage": "policy_validated",
            "message": f"Guardrails FAILED. Action blocked: {block_reason}"
        })
        new_status = "blocked_by_policy"
        # Log policy block
        cursor.execute("""
            INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
            VALUES (?, ?, ?, ?)
        """, (txn_id, timestamp, "ACTION_BLOCKED", f"Action '{analysis['recommended_action']}' blocked by policy: {block_reason}"))
    else:
        steps.append({
            "stage": "policy_validated",
            "message": "Guardrails PASSED. Action approved."
        })
        
        # 4. Simulation Engine (Seeded using txn_id and retry_count for deterministic runs)
        # Using a deterministic seed for the simulator ensures that when the demo is re-run,
        # it gives consistent, predictable, high-quality results.
        seed_str = f"{txn_id}-{txn['retry_count']}"
        sim_rng = random.Random(seed_str)
        
        action = analysis["recommended_action"]
        outcome_rand = sim_rng.random()
        
        steps.append({
            "stage": "executing",
            "message": f"Executing recovery strategy: '{action}'..."
        })
        
        if action == "retry_immediately" or action == "retry_after_delay":
            new_retry_count += 1
            if outcome_rand < analysis["recovery_probability"]:
                new_status = "recovered"
                steps.append({
                    "stage": "completed",
                    "message": f"Recovery successful! ₹{txn['amount']:,.2f} recovered via automated retry."
                })
                cursor.execute("""
                    INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                    VALUES (?, ?, ?, ?)
                """, (txn_id, timestamp, "RECOVERY_SUCCESS", f"Automated retry succeeded. Recovered ₹{txn['amount']:,.2f}."))
            else:
                new_status = "failed_attempt"
                steps.append({
                    "stage": "completed",
                    "message": "Recovery retry attempt failed. Transaction remains unpaid."
                })
                cursor.execute("""
                    INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                    VALUES (?, ?, ?, ?)
                """, (txn_id, timestamp, "RECOVERY_FAILED", "Automated retry attempt failed."))
                
        elif action == "suggest_alternative_payment":
            if outcome_rand < analysis["recovery_probability"] * 0.9:
                new_status = "recovered"
                steps.append({
                    "stage": "completed",
                    "message": f"Customer responded and completed payment via alternative method. ₹{txn['amount']:,.2f} recovered."
                })
                cursor.execute("""
                    INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                    VALUES (?, ?, ?, ?)
                """, (txn_id, timestamp, "RECOVERY_SUCCESS", f"Alternative payment successful. Recovered ₹{txn['amount']:,.2f}."))
            else:
                new_status = "failed_attempt"
                steps.append({
                    "stage": "completed",
                    "message": "Customer ignored suggestion or payment failed. Remaining at risk."
                })
                cursor.execute("""
                    INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                    VALUES (?, ?, ?, ?)
                """, (txn_id, timestamp, "RECOVERY_FAILED", "Customer alternative payment attempt failed."))
                
        elif action in ["personalized_reminder", "payment_link_follow_up"]:
            if outcome_rand < analysis["recovery_probability"] * 0.8:
                new_status = "recovered"
                steps.append({
                    "stage": "completed",
                    "message": f"Customer clicked recovery link and completed payment. ₹{txn['amount']:,.2f} recovered."
                })
                cursor.execute("""
                    INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                    VALUES (?, ?, ?, ?)
                """, (txn_id, timestamp, "RECOVERY_SUCCESS", f"Customer completed payment link. Recovered ₹{txn['amount']:,.2f}."))
            else:
                if outcome_rand > 0.5:
                    new_status = "ignored_by_customer"
                    steps.append({
                        "stage": "completed",
                        "message": "Customer opened recovery link/reminder but ignored it."
                    })
                    cursor.execute("""
                        INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                        VALUES (?, ?, ?, ?)
                    """, (txn_id, timestamp, "RECOVERY_IGNORED", "Recovery link ignored by customer."))
                else:
                    new_status = "failed_attempt"
                    steps.append({
                        "stage": "completed",
                        "message": "Customer failed to complete payment via reminder link."
                    })
                    cursor.execute("""
                        INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                        VALUES (?, ?, ?, ?)
                    """, (txn_id, timestamp, "RECOVERY_FAILED", "Reminder payment link failure."))
                    
        elif action == "human_escalation":
            new_status = "escalated_to_human"
            steps.append({
                "stage": "completed",
                "message": "Escalated to merchant operations support team for manual outreach."
            })
            cursor.execute("""
                INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                VALUES (?, ?, ?, ?)
            """, (txn_id, timestamp, "HUMAN_ESCALATED", "Case escalated to support desk for manual handling."))
            
        elif action == "stop_automated_recovery":
            new_status = "stopped"
            steps.append({
                "stage": "completed",
                "message": "Automated recovery sequence stopped to prevent customer friction."
            })
            cursor.execute("""
                INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
                VALUES (?, ?, ?, ?)
            """, (txn_id, timestamp, "RECOVERY_STOPPED", "Automated recovery sequence stopped."))
            
    # 5. Update DB
    cursor.execute("""
        UPDATE transactions
        SET status = ?,
            retry_count = ?,
            last_action_time = ?,
            recovery_probability = ?,
            priority_score = ?,
            expected_recovery_value = ?,
            recommended_action = ?,
            confidence = ?,
            policy_status = ?,
            blocked_reason = ?
        WHERE id = ?
    """, (
        new_status, new_retry_count, timestamp,
        analysis["recovery_probability"], analysis["priority_score"],
        analysis["expected_recovery_value"], analysis["recommended_action"],
        analysis["confidence"], new_policy_status, new_blocked_reason,
        txn_id
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "transaction_id": txn_id,
        "status": new_status,
        "analysis": analysis,
        "policy_status": new_policy_status,
        "blocked_reason": new_blocked_reason,
        "steps": steps
    }
