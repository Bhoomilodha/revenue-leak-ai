import os
import pytest
import sqlite3
from backend.database import DB_PATH, init_db, seed_db, get_db_connection
from backend.ai_engine import RecoveryScorer
from backend.recovery_engine import analyze_transaction, validate_policies, process_recovery_workflow

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    # Make sure DB is initialized and seeded before running tests
    init_db()
    seed_db()
    yield

def test_database_seeding():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify 600 transactions seeded
    cursor.execute("SELECT COUNT(*) FROM transactions")
    count = cursor.fetchone()[0]
    assert count == 600
    
    # Verify policies seeded
    cursor.execute("SELECT COUNT(*) FROM policies")
    policy_count = cursor.fetchone()[0]
    assert policy_count == 1
    
    conn.close()

def test_ai_scoring():
    scorer = RecoveryScorer()
    
    test_txn = {
        "amount": 2500.0,
        "payment_method": "UPI",
        "customer_success_rate": 0.9,
        "previous_transaction_count": 10,
        "previous_failure_count": 1,
        "retry_count": 0,
        "leak_type": "payment_failure",
        "failure_reason": "network_timeout"
    }
    
    prob = scorer.predict_probability(test_txn)
    assert 0.0 <= prob <= 1.0
    
    priority, expected_val = scorer.calculate_priority_and_expected_value(
        test_txn["amount"], prob, test_txn["retry_count"]
    )
    assert 0.0 <= priority <= 100.0
    assert expected_val == round(test_txn["amount"] * prob, 2)

def test_policy_validation():
    # Valid transaction
    test_txn = {
        "id": "TXN-TEST-1",
        "amount": 150.0,
        "retry_count": 0
    }
    
    analysis = {
        "recommended_action": "retry_immediately",
        "confidence": 0.85
    }
    
    policy = {
        "max_retries": 2,
        "min_confidence": 0.70,
        "high_value_threshold": 10000.0,
        "auto_action_enabled": 1
    }
    
    approved, reason = validate_policies(test_txn, analysis, policy)
    assert approved is True
    assert reason == ""

    # Test Blocked: Max retries exceeded
    test_txn["retry_count"] = 2
    approved, reason = validate_policies(test_txn, analysis, policy)
    assert approved is False
    assert "retry limit" in reason.lower()

    # Test Blocked: Confidence below threshold
    test_txn["retry_count"] = 0
    analysis["confidence"] = 0.50
    approved, reason = validate_policies(test_txn, analysis, policy)
    assert approved is False
    assert "confidence" in reason.lower()

    # Test Blocked: High value manual approval required
    analysis["confidence"] = 0.85
    test_txn["amount"] = 15000.0
    approved, reason = validate_policies(test_txn, analysis, policy)
    assert approved is False
    assert "exceeds high-value threshold" in reason.lower()

def test_recovery_simulation_and_audit():
    # Take a known transaction
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM transactions LIMIT 1")
    txn_id = cursor.fetchone()[0]
    conn.close()

    # Process workflow
    result = process_recovery_workflow(txn_id)
    assert "status" in result
    assert "analysis" in result
    assert "steps" in result
    assert len(result["steps"]) > 0

    # Verify audit logs created
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE transaction_id = ?", (txn_id,))
    log_count = cursor.fetchone()[0]
    assert log_count > 0
    conn.close()
