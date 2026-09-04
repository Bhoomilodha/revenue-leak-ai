# 🛡️ RevenueLeak AI — Autonomous Revenue Recovery Intelligence

> **A student-built fintech intelligence layer that detects, scores, and recovers leaked revenue across payment pipelines without annoying customers or violating gateway policies.**

Built with **React, TypeScript, FastAPI, Scikit-Learn, and SQLite**.  
Created for buildathons and portfolio showcase to solve a real-world merchant problem in the Indian digital payment ecosystem.

---

## 📌 Why I Built This (The Real-World Problem)

While studying digital payment gateways like **Razorpay**, I realized something surprising:  
Online businesses in India lose anywhere between **5% to 15% of their total potential revenue** through silent payment leaks.

These leaks aren't because customers don't want to buy, but due to friction in the payment journey:
- **Temporary bank & network dropouts**: UPI server timeouts, OTP delays, or momentary bank switch congestion.
- **Cart & checkout dropouts**: Users entering checkout with intent but abandoning due to payment friction.
- **Failed recurring subscriptions**: Mandate card expiry or insufficient balance on billing dates.
- **Overdue invoices**: B2B payments sitting uncollected without intelligent follow-up.

### The Current Flawed Approaches
Most merchants handle this in two bad ways:
1. **Do nothing**: The revenue is written off, and the customer churns.
2. **Blind retry bots**: Firing continuous automated retries. This leads to issuing bank penalties, excessive gateway fees, and frustrated customers who feel spammed.

### The Solution: RevenueLeak AI
I designed **RevenueLeak AI** as a smart **Intelligence & Decision Layer** between the merchant and the payment gateway. Instead of blindly retrying, it answers four critical questions before taking action:
1. *Where exactly is revenue leaking across the business?*
2. *Which failed transactions actually have a high mathematical probability of being recovered?*
3. *What is the most respectful, optimal recovery channel (Smart Retry, UPI Payment Link, Reminder, or Human Escalation)?*
4. *Does this action comply with merchant safety rules (cooldown periods, retry caps, VIP thresholds)?*

---

## 🚀 Key Features & Walkthrough

### 1. 🌊 Interactive Revenue Flow & Narrative Landing
- A visual landing experience that demonstrates how transaction volume moves through the merchant pipeline.
- Visually shows how normal transactions flow smoothly, where drop-offs begin to occur, and how AI intelligence nodes identify and resolve bottlenecks.

### 2. 🗺️ Live Revenue Leak Map (4 Pipelines)
Categorizes and aggregates leakage across the four primary stages of modern e-commerce:
- **Checkout Abandonment** (Intent captured, cart left unpaid)
- **Payment Processing Failures** (Card declines, network timeouts, gateway dropouts)
- **Failed Subscription Renewals** (Recurring mandate declines, balance issues)
- **Overdue Invoices** (B2B invoices past due date)

Each pipeline card shows total volume at risk, recovery yield percentage, affected cases, and opens an interactive detail sheet displaying individual records.

### 3. 🧠 Machine Learning Recovery Scorer
Instead of using hardcoded rules or pretending to have an AI model, I implemented a real **Random Forest Classifier** (`scikit-learn`) trained on behavioral signals:
- **Signals Evaluated**: Transaction Amount, Payment Method (UPI, Card, NetBanking, Wallet), Customer Historical Success Rate, Prior Failure Count, and Current Retry Exposure.
- **Outputs**:
  - **Recovery Probability (0–100%)**: Calibrated probability from `predict_proba`.
  - **Decision Confidence (0–100%)**: Classification certainty score.
  - **Expected Recovery Value (₹)**: Amount multiplied by Recovery Probability.
  - **Priority Score (0–100)**: Calculated as:
    $$\text{Priority Score} = (\text{Recovery Prob.} \times 70) + \left(\frac{\min(\text{Amount}, 10000)}{10000} \times 20\right) + \left(\left(1 - \frac{\text{Retries}}{3}\right) \times 10\right)$$
- **Model Evaluation**: Evaluated against an isolated test split, achieving **~68.2% Accuracy** and **~0.76 ROC-AUC**.

### 4. 🔬 AI Recovery Sandbox / Lab
An interactive testing environment where you can pick any unresolved transaction and watch the orchestrator make decisions in real time:
- **Case Summary**: Full breakdown of the selected transaction.
- **AI Assessment**: Probability, Decision Confidence, and Expected Recovery Value.
- **Why This Decision? (Decision Signals)**: Transparent explainability box showing why a particular strategy was chosen (e.g., customer historical success rate, failure diagnostic, and reasoning summary).
- **6-Stage Visual Journey**: Live state machine that animates through *Detection → Feature Extraction → ML Scoring → Strategy Selection → Guardrail Validation → Simulated Outcome*.
- **3-Step Console Telemetry**: Structured diagnostic output (`01. DIAGNOSTIC`, `02. IMPACT`, `03. NEXT STEP`).

### 5. 🛡️ Merchant Policy & Safety Guardrails
To prevent AI hallucinations or abusive automation, all proposed recovery actions must pass through strict policy rules:
- **Max Retry Cap**: Restricts robotic retry loops (default: 2 retries) to protect gateway reputation.
- **Min Decision Confidence Threshold**: Blocks actions when the model isn't confident enough (default: 70%).
- **Reminder Cooldown Window (Hours)**: Enforces a quiet period (default: 24h) so customers are never spammed.
- **High-Value Escalation Threshold**: Any transaction above ₹10,000 is automatically routed to human account managers rather than handled by an automated bot.

### 6. 📋 Prioritized Recovery Queue
- A live worklist of outstanding recovery opportunities sorted by AI Priority Score and Expected Recovery Value.
- Features search by Case ID/Customer, filtering by leak category or status, and a 1-click **Open in Lab** button to inspect any case.

### 7. ⚡ Scoped Batch Simulation
- Enables merchants to test recovery operations on batches of **25, 50, 100, or 250 records**.
- Correctly scopes and calculates batch-specific metrics: Batch Revenue at Risk, Net Recovered Amount, Batch Recovery Rate, Human Escalations, and Guardrail Blocks.
- Persists state updates directly into the SQLite database.

### 8. 📜 Traceable Audit Trail
- Every single system evaluation, policy block, and recovery attempt is permanently recorded.
- Shows timestamp, Case ID, Event Type, Guardrail Status (ALLOWED / BLOCKED), and human-readable narrative.

---

## 🏗️ System Architecture

```text
                                  [ Razorpay Merchant Pipeline ]
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │ Leak Detection Engine│
                                    └──────────┬───────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │  AI Recovery Opportunity Scorer   │
                              │  (Scikit-Learn Random Forest)    │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     Strategy Recommendation      │
                              │(Smart Retry / UPI Link / Human)  │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │   Merchant Policy Guardrails     │
                              │  (Cooldowns, Limits, Thresholds) │
                              └────────┬─────────────────┬───────┘
                        Approved       │                 │ Blocked
                                       ▼                 ▼
                        ┌────────────────────┐   ┌────────────────────┐
                        │ Execution Simulator│   │  Blocked / Audit   │
                        └─────────┬──────────┘   └─────────┬──────────┘
                                  │                        │
                                  └──────────┬─────────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │   SQLite Database   │
                                  │   & Audit Ledger    │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │ React SPA Dashboard │
                                  └─────────────────────┘
```

---

## 💻 Tech Stack & Design Choices

| Component | Technology | Why I Chose It |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Strong type-safety across transaction models and sub-second HMR during development. |
| **Styling & UI** | Tailwind CSS, Lucide Icons | Clean, custom dark fintech aesthetics without heavy UI framework bloat. |
| **Backend API** | FastAPI (Python 3.11) | High-performance async API with automatic OpenAPI Swagger documentation. |
| **Machine Learning** | Scikit-Learn, Joblib | Reliable classification on tabular data with calibrated probabilities; lightweight serialization. |
| **Database** | SQLite3 | Zero external server dependencies; anyone can clone and run it in 1 minute. |
| **Testing** | Pytest | Automated verification of scoring, policy rules, and recovery simulation. |

---

## 🛠️ How to Run Locally

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** & 
pm

### Step 1: Clone the Repository
`ash
git clone https://github.com/<your-username>/revenue-leak-ai.git
cd revenue-leak-ai
`

### Step 2: Backend Setup
`ash
# 1. Install Python packages
pip install -r requirements.txt

# 2. Initialize the database and train the ML model
python backend/database.py
python backend/ai_engine.py

# 3. Start the FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
`
* Backend will be running at: http://127.0.0.1:8000
* Interactive API Swagger Docs: http://127.0.0.1:8000/docs

### Step 3: Frontend Setup
In a new terminal window:
`ash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server
npm run dev
`
* Open your browser at: http://localhost:5173

### Step 4: Run Backend Tests
To verify all policy rules and ML inference workflows:
`ash
python -m pytest backend/test_recovery.py
`
*(All 4 test suites will run and pass).*

---

## 🎓 What I Learned While Building This

Building this project taught me several practical software engineering lessons beyond simple tutorials:
1. **AI Explainability is Critical in Finance**: A merchant will never trust an AI that simply says *"Run retry"*. Showing *why* (customer's 92% past success rate, specific failure diagnostic, and expected monetary recovery) builds trust.
2. **Autonomous Systems Need Strict Guardrails**: Without hard policy rules (like cooldown windows and retry limits), automated systems easily damage customer relationships and incur bank penalty fees.
3. **Reproducible Simulations**: Using seeded random distributions tied to transaction IDs ensures that running simulations and audit trails produce verifiable, deterministic behavior.
4. **Clean Decoupling**: Keeping the UI purely driven by backend state ensures that if this were connected to real Razorpay webhooks in production, the frontend would require zero architectural changes.

---

## 🔮 Future Enhancements
- [ ] Connect directly to live Razorpay Webhooks (payment.failed, subscription.halted, order.paid).
- [ ] Automated WhatsApp Commerce interactive recovery links with Razorpay UPI Intent.
- [ ] Multi-tenant merchant isolation with custom risk-tolerance profiles.

---

## 📄 License & Academic Integrity
This project is open-source under the MIT License. Developed as an independent student project for portfolio evaluation and technical demonstration.
