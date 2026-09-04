import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = "revenue_leak.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            leak_type TEXT,
            amount REAL,
            payment_method TEXT,
            customer_id TEXT,
            customer_success_rate REAL,
            previous_transaction_count INTEGER,
            previous_failure_count INTEGER,
            status TEXT,
            failure_reason TEXT,
            retry_count INTEGER,
            last_action_time TEXT,
            recovery_probability REAL,
            priority_score REAL,
            expected_recovery_value REAL,
            recommended_action TEXT,
            confidence REAL,
            policy_status TEXT,
            blocked_reason TEXT
        )
    """)
    
    # Create policies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY,
            max_retries INTEGER,
            min_confidence REAL,
            reminder_cooldown_hours INTEGER,
            high_value_threshold REAL,
            auto_action_enabled INTEGER
        )
    """)
    
    # Create audit_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT,
            timestamp TEXT,
            event_type TEXT,
            details TEXT
        )
    """)
    
    conn.commit()
    conn.close()

def seed_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if we already have transactions
    cursor.execute("SELECT COUNT(*) FROM transactions")
    if cursor.fetchone()[0] > 0:
        print("Database already seeded.")
        conn.close()
        return
        
    # Clear any existing rows (just to be safe)
    cursor.execute("DELETE FROM transactions")
    cursor.execute("DELETE FROM policies")
    cursor.execute("DELETE FROM audit_logs")
    
    # Seed default policies
    cursor.execute("""
        INSERT INTO policies (id, max_retries, min_confidence, reminder_cooldown_hours, high_value_threshold, auto_action_enabled)
        VALUES (1, 2, 0.70, 24, 10000.0, 1)
    """)
    
    # Setup random state for reproducibility
    rng = random.Random(42)
    
    # Lists for synthetic generation
    leak_types = ['payment_failure', 'checkout_abandonment', 'failed_subscription', 'overdue_invoice']
    payment_methods = ['UPI', 'card', 'netbanking', 'wallet']
    
    reasons_by_leak = {
        'payment_failure': ['insufficient_funds', 'authentication_failed', 'network_timeout', 'bank_downtime'],
        'checkout_abandonment': ['cart_abandoned', 'checkout_closed', 'payment_page_exit'],
        'failed_subscription': ['card_expired', 'insufficient_funds', 'mandate_failed'],
        'overdue_invoice': ['invoice_ignored', 'disputed_amount', 'payment_delayed']
    }
    
    # Generate 600 transactions
    now = datetime.utcnow()
    transactions = []
    
    for i in range(1, 601):
        txn_id = f"TXN-{10000 + i}"
        leak_type = rng.choice(leak_types)
        
        # Generate amount in INR. Make some high value, most low/medium.
        amount_rand = rng.random()
        if amount_rand < 0.1: # 10% high value (INR 10,000 to 50,000)
            amount = round(rng.uniform(10000.0, 50000.0), 2)
        elif amount_rand < 0.4: # 30% medium-high value (INR 2,500 to 10,000)
            amount = round(rng.uniform(2500.0, 10000.0), 2)
        else: # 60% low/medium value (INR 100 to 2,500)
            amount = round(rng.uniform(100.0, 2500.0), 2)
            
        payment_method = rng.choice(payment_methods)
        customer_id = f"CUST-{rng.randint(20000, 25000)}"
        
        # Customer behavioral signals
        prev_txn = rng.randint(1, 30)
        prev_fail = rng.randint(0, min(prev_txn // 2, 8))
        success_rate = round(1.0 - (prev_fail / prev_txn), 2)
        
        # Current transaction status (starting at failed/unresolved)
        status = 'failed'
        failure_reason = rng.choice(reasons_by_leak[leak_type])
        retry_count = rng.randint(0, 1) # some start with 0 retries, some with 1
        
        # Set time between 1 and 48 hours ago
        hours_ago = rng.uniform(1.0, 48.0)
        txn_time = (now - timedelta(hours=hours_ago)).isoformat()
        
        # We leave scoring columns empty or set them to placeholder.
        # AI Scorer will score them. Let's set placeholders.
        recovery_probability = 0.0
        priority_score = 0.0
        expected_recovery_value = 0.0
        recommended_action = "none"
        confidence = 0.0
        policy_status = "pending"
        blocked_reason = ""
        
        transactions.append((
            txn_id, leak_type, amount, payment_method, customer_id, success_rate,
            prev_txn, prev_fail, status, failure_reason, retry_count, txn_time,
            recovery_probability, priority_score, expected_recovery_value,
            recommended_action, confidence, policy_status, blocked_reason
        ))
        
    cursor.executemany("""
        INSERT INTO transactions (
            id, leak_type, amount, payment_method, customer_id, customer_success_rate,
            previous_transaction_count, previous_failure_count, status, failure_reason,
            retry_count, last_action_time, recovery_probability, priority_score,
            expected_recovery_value, recommended_action, confidence, policy_status, blocked_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, transactions)
    
    # Add initial audit logs for the database seeding
    # Let's add 5 audit logs representing recent leaks detected
    recent_txns = sorted(transactions, key=lambda x: x[11], reverse=True)[:5]
    for r_txn in recent_txns:
        cursor.execute("""
            INSERT INTO audit_logs (transaction_id, timestamp, event_type, details)
            VALUES (?, ?, ?, ?)
        """, (
            r_txn[0],
            r_txn[11],
            "LEAK_DETECTED",
            f"Revenue leak detected of type '{r_txn[1]}' for amount ₹{r_txn[2]:,.2f}. Reason: {r_txn[9]}."
        ))
        
    conn.commit()
    conn.close()
    print("Database seeded successfully with 600 synthetic records.")

if __name__ == "__main__":
    init_db()
    seed_db()
