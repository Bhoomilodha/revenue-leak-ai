# RevenueLeak AI - 5-Minute Pitch & Demo Script

This script walks through a structured demonstration of RevenueLeak AI, highlighting how it acts as an active Revenue Recovery Intelligence Layer.

---

## The Pitch Narrative
> "Merchants lose millions in silent revenue leaks—abandoned checkouts, temporary bank downtimes, expired subscription cards, and overdue invoices. Current systems handle this reactively: retrying transactions blindly (which damages card reputation) or ignoring them. 
> RevenueLeak AI acts as an **Intelligence Layer** that prioritizes high-value opportunities based on recovery probability using a trained AI model, checks policy guardrails, and safely simulates bounded recovery workflows."

---

## Demo Flow

### Step 1: The Command Center (Overview Page)
1. **Show the Metrics**: Point out the **Revenue At Risk** (e.g. ₹1,20,000) versus the **Revenue Recovered**.
2. **Explain the Value**: Highlight the **Est. Recoverable (AI)** value. Explain that this is not a random estimate; it is the sum of expectations computed by a Random Forest Classifier trained on merchant transaction behaviors.
3. **Audit Feed**: Show the live event logger showing that leaks are actively being ingested.

### Step 2: The Revenue Leak Map (Channel Deep-dive)
1. Navigate to the **Revenue Leak Map** tab.
2. Observe the horizontal pipeline representing the flow of transaction stages:
   `Checkout` → `Payment Processing` → `Subscriptions` → `Receivables`
3. Click on the **Payment Processing** node.
4. **Side-Sheet Analysis**: Point out the sliding pane showing:
   - **Why this leak was prioritized**: A human-readable AI explanation of the category's health.
   - **Distribution of probability**: Shows how many cases lie in high vs low recovery zones.
   - **Top affected transactions**: Direct look at the individual cases that are driving this leak.

### Step 3: Bounded Sandbox Analysis (AI Recovery Lab)
1. Navigate to the **AI Recovery Lab** tab.
2. Select a transaction ID from the dropdown list.
3. Show the **Signal Features Vector** (amount, payment method, customer success rates).
4. Click **RUN AI RECOVERY ANALYSIS**.
5. Observe the 10 sequential pipeline stages completing.
6. Look at the cards generated:
   - **AI Scorer Logic**: Shows exactly **"WHY THIS ACTION?"** (e.g., transient network error, high success history, recommending immediate retry).
   - **Guardrail Policy Checks**: Explains why the action passed or failed the merchant-defined guidelines (e.g., retry count vs max limit).
   - **Simulation Verification**: Demonstrates a seeded transaction simulation, showing the updated database status (e.g. "Recovered", "Escalated to Human", "Blocked").

### Step 4: System Guardrails (Policy & Guardrails)
1. Navigate to the **Policy & Guardrails** tab.
2. Change the **Min Confidence Threshold** to a very high level (e.g. `0.95`).
3. Click **Save Policy Configuration**.
4. Go back to the **AI Recovery Lab**, select a transaction, and run the analysis.
5. Point out how the policy engine now flags the transaction as **ACTION BLOCKED** (because the confidence of 85% is below the new 95% threshold), preserving the customer experience.

### Step 5: Large-Scale Action (Batch Simulator)
1. Click the **Batch Simulator** button in the header.
2. Choose **50 Records** and click **Execute Batch Actions**.
3. Watch the progress bar complete.
4. Show the **BEFORE vs AFTER** metrics:
   - Total recovered revenue delta (e.g., ₹25,000+ recovered instantly).
   - Number of manual support escalations.
   - Number of unsafe actions blocked by guardrails.
5. Click **Return to command center** and show how the Overview page is now fully updated, indicating a single consistent database state.
