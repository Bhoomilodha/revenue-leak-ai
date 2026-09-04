# 🛡️ RevenueLeak AI — Autonomous Revenue Recovery Intelligence

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Open_Application-2563eb?style=for-the-badge)](https://revenueleakai-9e36d0.netlify.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Bhoomilodha/revenue-leak-ai)
[![Tech Stack](https://img.shields.io/badge/Stack-React_18_•_TypeScript_•_FastAPI_•_Scikit--Learn-059669?style=for-the-badge)](#-tech-stack--engineering-choices)

> 🔗 **Live Web Application**: **[https://revenueleakai-9e36d0.netlify.app](https://revenueleakai-9e36d0.netlify.app)**  
> *(Click above to test the fully interactive application live in your browser — 24/7 active, no installation required)*

---

## ⚡ Executive Summary (For Reviewers)

Online merchants routinely lose between **5% to 15% of top-line revenue** to silent transaction failures: temporary UPI network timeouts, expired subscription cards, checkout cart dropouts, and forgotten B2B invoices.

Traditional payment systems react in two flawed ways:
1. **Passive write-offs**: Revenue is lost permanently, and the customer silently churns.
2. **Blind retry bots**: Firing continuous automated retries that trigger issuing bank penalties, incur gateway fees, and annoy customers.

**RevenueLeak AI** is an intelligent **Revenue Recovery Layer** built for payment gateways like Razorpay. Instead of robotic retries, it uses **Machine Learning to evaluate recovery probability**, validates decisions against **Merchant Safety Guardrails**, and triggers the most respectful, optimal recovery channel (Smart UPI Link, Cooldown-based Retry, or VIP Human Escalation).

---

## 🎯 The Core Problem & Comparison

| Without RevenueLeak AI | With RevenueLeak AI |
|---|---|
| **Silent Revenue Bleed**: 5–15% revenue lost without visibility into where drop-offs happen. | **Pipeline Observability**: Real-time Leak Map tracking volume at risk across Checkout, Gateway, Subscriptions, and Invoicing. |
| **Dumb Retries**: Repeating retries immediately on failed cards causes bank penalties. | **Predictive AI Scoring**: Random Forest ML model evaluates if a transaction has high recovery probability before taking action. |
| **Spamming Customers**: Frequent reminder messages cause friction and customer churn. | **Policy Guardrails**: Hard quiet periods (cooldown window in hours) and max retry limits protect customer relationships. |
| **VIP Customer Friction**: High-value enterprise deals treated with the same robotic retry as small carts. | **Intelligent Routing**: High-value transactions (₹10,000+) automatically route to human support managers. |

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

## 🛠️ Local Development & Setup (Optional)

> **Quick Note for Reviewers**: You can explore the full interactive application directly on the **[Live Web App](https://revenueleakai-9e36d0.netlify.app)** without installing anything. The steps below are only needed if you wish to run or inspect the code locally.

### Prerequisites
- Python 3.9+
- Node.js 18+ & `npm`

### 1. Clone the Repository
```bash
git clone https://github.com/Bhoomilodha/revenue-leak-ai.git
cd revenue-leak-ai
```

### 2. Backend Setup
```bash
# Install dependencies & initialize model
pip install -r requirements.txt
python backend/database.py
python backend/ai_engine.py

# Start FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Run Automated Backend Tests
```bash
python -m pytest backend/test_recovery.py
```
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
