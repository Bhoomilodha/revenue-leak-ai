import os
import random
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import joblib

MODEL_PATH = "backend/recovery_model.joblib"

# Define mappings for encoding
LEAK_TYPES = ['payment_failure', 'checkout_abandonment', 'failed_subscription', 'overdue_invoice']
PAYMENT_METHODS = ['UPI', 'card', 'netbanking', 'wallet']

def generate_historical_data(n_samples=2500, seed=42):
    """
    Generates a synthetic historical dataset with realistic correlations.
    This simulates ground-truth merchant data where recovery events were either
    successful (1) or unsuccessful (0).
    """
    rng = random.Random(seed)
    data = []
    
    for i in range(n_samples):
        leak_type = rng.choice(LEAK_TYPES)
        payment_method = rng.choice(PAYMENT_METHODS)
        
        # Amount in INR
        amount_rand = rng.random()
        if amount_rand < 0.1:
            amount = rng.uniform(10000.0, 50000.0)
        elif amount_rand < 0.4:
            amount = rng.uniform(2500.0, 10000.0)
        else:
            amount = rng.uniform(100.0, 2500.0)
            
        # Customer behavioral stats
        prev_txn = rng.randint(1, 30)
        prev_fail = rng.randint(0, min(prev_txn // 2, 8))
        customer_success_rate = 1.0 - (prev_fail / prev_txn)
        
        retry_count = rng.randint(0, 3)
        
        # Calculate latent probability of recovery with clear correlations
        # Base probability
        prob = 0.35 
        
        # Leak type influence
        if leak_type == 'payment_failure':
            prob += 0.25
        elif leak_type == 'checkout_abandonment':
            prob += 0.10
        elif leak_type == 'failed_subscription':
            prob += 0.05
        elif leak_type == 'overdue_invoice':
            prob -= 0.15
            
        # Payment method influence
        if payment_method == 'UPI':
            prob += 0.15
        elif payment_method == 'card':
            prob += 0.10
        elif payment_method == 'wallet':
            prob += 0.05
        elif payment_method == 'netbanking':
            prob -= 0.05
            
        # Customer success history influence
        prob += 0.30 * (customer_success_rate - 0.5)
        
        # Retry count penalty (repeated retries reduce chance of recovery)
        prob -= 0.08 * retry_count
        
        # High value transaction friction
        if amount > 10000.0:
            prob -= 0.12
            
        # Add random noise
        prob += rng.normalvariate(0, 0.05)
        
        # Clip probability
        prob = max(0.02, min(0.98, prob))
        
        # Draw binary ground-truth label
        recovered = 1 if rng.random() < prob else 0
        
        data.append({
            'leak_type': leak_type,
            'payment_method': payment_method,
            'amount': amount,
            'customer_success_rate': customer_success_rate,
            'previous_transaction_count': prev_txn,
            'previous_failure_count': prev_fail,
            'retry_count': retry_count,
            'recovered': recovered
        })
        
    return pd.DataFrame(data)

def preprocess_df(df):
    """
    Applies one-hot encoding to categorical features.
    """
    # Create empty columns for one-hot representation to ensure stability
    for lt in LEAK_TYPES:
        df[f'leak_{lt}'] = (df['leak_type'] == lt).astype(int)
    for pm in PAYMENT_METHODS:
        df[f'pay_{pm}'] = (df['payment_method'] == pm).astype(int)
        
    features = [
        'amount', 'customer_success_rate', 'previous_transaction_count', 
        'previous_failure_count', 'retry_count'
    ] + [f'leak_{lt}' for lt in LEAK_TYPES] + [f'pay_{pm}' for pm in PAYMENT_METHODS]
    
    return df[features], df['recovered'] if 'recovered' in df else None

def train_ai_model():
    """
    Generates historical synthetic data, trains the classifier, logs metrics,
    and serializes the trained model.
    """
    print("Generating synthetic historical dataset for training...")
    raw_df = generate_historical_data(n_samples=3000, seed=42)
    X, y = preprocess_df(raw_df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    
    print("\n=== AI Model Training Complete ===")
    print(f"Accuracy Score: {accuracy:.4f}")
    print(f"ROC-AUC Score: {roc_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("==================================\n")
    
    # Save the model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved trained model to {MODEL_PATH}")
    
    return model

class RecoveryScorer:
    def __init__(self):
        self.model = None
        self.load_model()
        
    def load_model(self):
        if not os.path.exists(MODEL_PATH):
            self.model = train_ai_model()
        else:
            try:
                self.model = joblib.load(MODEL_PATH)
                print(f"Loaded trained AI model from {MODEL_PATH}")
            except Exception as e:
                print(f"Error loading model: {e}. Retraining...")
                self.model = train_ai_model()
                
    def get_features_vector(self, txn_dict):
        """
        Builds a pandas DataFrame with one-hot encoded variables matching training features.
        """
        df = pd.DataFrame([txn_dict])
        X, _ = preprocess_df(df)
        return X
        
    def predict_probability(self, txn_dict):
        """
        Predicts recovery probability.
        """
        X = self.get_features_vector(txn_dict)
        prob = self.model.predict_proba(X)[0][1]
        return round(float(prob), 4)

    def calculate_priority_and_expected_value(self, amount, probability, retry_count):
        """
        Transparent priority score formula (out of 100):
        - 70% based on recovery probability
        - 20% based on financial magnitude (INR, capped at 10,000 for scaling)
        - 10% based on retries remaining (fewer retries = higher priority)
        """
        expected_value = round(amount * probability, 2)
        
        # Scaling amount: capped at 10k INR
        amount_factor = min(amount, 10000.0) / 10000.0
        
        # Retry penalty: 0 retries = 1.0, 1 retry = 0.67, 2 retries = 0.33, 3+ retries = 0.0
        retry_factor = max(0.0, 1.0 - (retry_count / 3.0))
        
        priority = (probability * 70.0) + (amount_factor * 20.0) + (retry_factor * 10.0)
        
        return round(priority, 1), expected_value

if __name__ == "__main__":
    # If run directly, train the model
    train_ai_model()
