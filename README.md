# 🛡️ RevenueLeak AI

### AI-Powered Revenue Recovery Intelligence Platform

RevenueLeak AI helps merchants identify revenue at risk, predict recovery probability, prioritize high-value recovery opportunities, and recommend suitable recovery actions using Machine Learning.

> **Built as a fintech product prototype focused on AI-driven revenue recovery decisions.**

---

## 🚀 Live Demo

🔗 **Live Demo:** https://revenueleakai-9e36d0.netlify.app

💻 **GitHub:** https://github.com/Bhoomilodha/revenue-leak-ai

🎥 **Product Demo:** Add your demo video link here

---

## 💡 Problem

Revenue can be lost through:

- Failed payments
- Checkout abandonment
- Subscription payment failures
- Overdue receivables

Merchants need to know **which revenue opportunities should be recovered first and what action makes sense.**

### Solution

RevenueLeak AI creates an intelligent recovery workflow:

**Detect → Analyze → Prioritize → Validate → Recommend → Simulate → Audit**

---

## ✨ Key Features

- 📊 **Revenue Flow Dashboard** — Track recovered, at-risk and potential revenue.
- 🗺️ **Revenue Leak Map** — Visualize where revenue is leaking across the payment lifecycle.
- 🤖 **ML Recovery Scorer** — Predict recovery probability using a Random Forest model.
- 🧪 **AI Recovery Lab** — Analyze individual recovery opportunities and simulate outcomes.
- 🛡️ **Policy & Guardrails** — Control retries, confidence thresholds and automated actions.
- 📋 **Recovery Queue** — Prioritize opportunities based on recovery potential and financial impact.
- 📈 **Batch Simulator** — Simulate multiple recovery opportunities and measure outcomes.
- 🔎 **Audit Trail** — Track decisions, policy checks and simulated recovery actions.

---

## 🤖 AI / ML

The platform uses a **Random Forest Classifier** trained on privacy-safe synthetic transaction data.

### Model Metrics

- Accuracy: ~68%
- ROC-AUC: ~0.76
- Output: Recovery Probability

The recovery probability is combined with transaction value and other signals to calculate **Expected Recovery Value** and **Priority Score**.

> The current model is a prototype trained on synthetic data.

---

## 🏗️ Architecture

```text
React + TypeScript Frontend
            ↓
        FastAPI API
            ↓
     Recovery Engine
      ↙           ↘
 ML Model       Policy Engine
      ↓             ↓
Recovery       Guardrails
Probability        ↓
      └──────→ Decision
                  ↓
          Simulated Outcome
                  ↓
             Audit Trail
