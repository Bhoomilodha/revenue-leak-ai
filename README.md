# RevenueLeak AI

## AI-Powered Revenue Recovery Intelligence Platform

RevenueLeak AI is a fintech prototype that helps merchants identify revenue at risk, predict recovery probability, prioritize high-value opportunities, and recommend suitable recovery actions using Machine Learning.

## Live Demo

Live Demo: https://revenueleakai-9e36d0.netlify.app

GitHub: https://github.com/Bhoomilodha/revenue-leak-ai

## Problem

Revenue can be lost through failed payments, checkout abandonment, subscription failures, and overdue receivables.

The challenge is not only detecting these leaks, but deciding:

- Which opportunity should be recovered first?
- How likely is it to be recovered?
- What action should be recommended?
- Is the action allowed by merchant policies?
- What was the resulting outcome?

## Solution

RevenueLeak AI provides an end-to-end decision workflow:

Detect → Analyze → Prioritize → Validate → Recommend → Simulate → Audit

The system combines Machine Learning, financial impact, recovery probability, and merchant-defined policies to prioritize recovery opportunities.

## Key Features

- Revenue Flow Dashboard
- Interactive Revenue Leak Map
- ML-based Recovery Scoring
- AI Recovery Lab
- Recovery Opportunities Queue
- Policy & Safety Guardrails
- Batch Recovery Simulator
- Audit Trail
- Simulated Recovery Outcomes

## AI / ML

The system uses a Random Forest Classifier trained on privacy-safe synthetic transaction data.

Model metrics:

- Accuracy: ~68%
- ROC-AUC: ~0.76
- Output: Recovery Probability

The predicted recovery probability is combined with transaction value and other signals to calculate Expected Recovery Value and Priority Score.

## Tech Stack

| Layer | Technologies |
|------|--------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | SQLite |
| Machine Learning | Scikit-learn, Random Forest |
| Data & Simulation | Synthetic transaction data, deterministic simulation |

## Architecture

```text
React + TypeScript
        ↓
     FastAPI
        ↓
 Recovery Engine
    ↙       ↘
ML Model   Policy Engine
    ↓          ↓
Recovery    Guardrails
Probability    ↓
    └────→ Decision
              ↓
      Simulated Outcome
              ↓
         Audit Trail
````

## Application Flow

```text
Revenue at Risk
       ↓
AI Analysis
       ↓
Recovery Probability
       ↓
Expected Recovery Value
       ↓
Priority Score
       ↓
Policy Validation
       ↓
Recovery Recommendation
       ↓
Simulated Outcome
```

## Project Highlights

The main focus of RevenueLeak AI is the decision layer.

Instead of simply retrying a failed transaction, the platform determines which recovery opportunity is more valuable, why it should be prioritized, what action is suitable, whether that action passes merchant guardrails, and how the simulated outcome is recorded.

## Disclaimer

RevenueLeak AI is a student-built fintech prototype.

The current system uses synthetic transaction data and simulated recovery execution. It does not process real payments or contact real customers.

## Future Enhancements

* Real payment webhook integration
* Production authentication
* Multi-tenant merchant support
* Real-world transaction datasets
* Automated recovery integrations

## Built By

Bhoomi Lodha
B.Tech CSE (AI & ML)

