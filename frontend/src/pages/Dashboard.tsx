import { useState, useEffect } from "react";
import {
  Activity,
  Shield,
  AlertTriangle,
  Map,
  FlaskConical,
  ListOrdered,
  History,
  Search,
  Play,
  RefreshCw,
  Lock,
  Sliders,
  LogOut,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  BrainCircuit,
  Info
} from "lucide-react";

import PageTransition from "../components/PageTransition";
import RevenueFlow from "../components/RevenueFlow";
import LeakMap from "../components/LeakMap";
import RecoveryGraph from "../components/RecoveryGraph";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000/api";

// --- TYPES ---
interface Transaction {
  id: string;
  leak_type: string;
  amount: number;
  payment_method: string;
  customer_id: string;
  customer_success_rate: number;
  previous_transaction_count: number;
  previous_failure_count: number;
  status: string;
  failure_reason: string;
  retry_count: number;
  last_action_time: string;
  recovery_probability: number;
  priority_score: number;
  expected_recovery_value: number;
  recommended_action: string;
  confidence: number;
  policy_status: string;
  blocked_reason: string;
}

interface Stats {
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number;
  expected_recovery_value: number;
  high_priority_leaks: any[];
  activity_feed: any[];
}

interface LeakMapCategory {
  name: string;
  amount_at_risk: number;
  recoverability: number;
  priority_score: number;
  expected_recovery_value: number;
  affected_cases: number;
}

interface Policy {
  id: number;
  max_retries: number;
  min_confidence: number;
  reminder_cooldown_hours: number;
  high_value_threshold: number;
  auto_action_enabled: boolean;
}

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [leakMapData, setLeakMapData] = useState<Record<string, LeakMapCategory> | null>(null);
  const [queue, setQueue] = useState<Transaction[]>([]);
  const [policies, setPolicies] = useState<Policy | null>(null);
  const [blockedCases, setBlockedCases] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States for Queue
  const [filterLeakType, setFilterLeakType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // AI Lab States
  const [labTxnId, setLabTxnId] = useState<string>("");
  const [labTxn, setLabTxn] = useState<Transaction | null>(null);
  const [labAnalysis, setLabAnalysis] = useState<any | null>(null);
  const [labPolicyCheck, setLabPolicyCheck] = useState<any | null>(null);
  const [labOutcome, setLabOutcome] = useState<any | null>(null);
  const [labRunning, setLabRunning] = useState<boolean>(false);
  const [labStepStatus, setLabStepStatus] = useState<string[]>(Array(10).fill("pending")); 
  const [labConsoleMsg, setLabConsoleMsg] = useState<string>("");

  // Leak Map Details Side-sheet State
  const [sheetCategory, setSheetCategory] = useState<string | null>(null);
  const [sheetDetails, setSheetDetails] = useState<any | null>(null);
  const [sheetLoading, setSheetLoading] = useState<boolean>(false);

  // Batch Simulator States
  const [batchCount, setBatchCount] = useState<number>(25);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchOutcome, setBatchOutcome] = useState<any | null>(null);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  // Policy Form State
  const [policyForm, setPolicyForm] = useState({
    max_retries: 2,
    min_confidence: 0.70,
    reminder_cooldown_hours: 24,
    high_value_threshold: 10000,
    auto_action_enabled: true
  });

  // Load operational data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch(`${API_BASE}/stats`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const mapRes = await fetch(`${API_BASE}/leak-map`);
      const mapData = await mapRes.json();
      setLeakMapData(mapData);

      const queueRes = await fetch(`${API_BASE}/queue`);
      const queueData = await queueRes.json();
      setQueue(queueData);

      const policyRes = await fetch(`${API_BASE}/policies`);
      const policyData = await policyRes.json();
      setPolicies(policyData.policy);
      setBlockedCases(policyData.blocked_cases);
      setPolicyForm({
        max_retries: policyData.policy.max_retries,
        min_confidence: policyData.policy.min_confidence,
        reminder_cooldown_hours: policyData.policy.reminder_cooldown_hours,
        high_value_threshold: policyData.policy.high_value_threshold,
        auto_action_enabled: policyData.policy.auto_action_enabled,
      });

      const auditRes = await fetch(`${API_BASE}/audit`);
      const auditData = await auditRes.json();
      setAuditLogs(auditData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "queue") {
      fetchQueue();
    } else if (activeTab === "audit") {
      fetchAudit();
    } else if (activeTab === "policies") {
      fetchPolicies();
    } else if (activeTab === "overview") {
      fetchOverviewStats();
    } else if (activeTab === "leak-map") {
      fetchLeakMap();
    }
  }, [activeTab, filterLeakType, filterStatus, searchQuery]);

  const fetchOverviewStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeakMap = async () => {
    try {
      const res = await fetch(`${API_BASE}/leak-map`);
      setLeakMapData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQueue = async () => {
    try {
      const params = new URLSearchParams();
      if (filterLeakType) params.append("leak_type", filterLeakType);
      if (filterStatus) params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);
      const res = await fetch(`${API_BASE}/queue?${params.toString()}`);
      setQueue(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`${API_BASE}/policies`);
      const data = await res.json();
      setPolicies(data.policy);
      setBlockedCases(data.blocked_cases);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit`);
      setAuditLogs(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const openCategoryDetails = async (leakType: string) => {
    setSheetCategory(leakType);
    setSheetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leak-map/detail?leak_type=${leakType}`);
      const data = await res.json();
      setSheetDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSheetLoading(false);
    }
  };

  const handlePolicySave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/policies`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyForm),
      });
      if (res.ok) {
        alert("Policy guardrails updated successfully!");
        fetchPolicies();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runLabRecoveryWorkflow = async (id: string) => {
    if (!id) return;
    setLabRunning(true);
    setLabStepStatus(Array(10).fill("pending"));
    setLabOutcome(null);
    setLabAnalysis(null);
    setLabPolicyCheck(null);
    setLabConsoleMsg("Initializing AI Orchestrator...");

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Step 1: Leak detected
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[0] = "active";
        return next;
      });
      await sleep(400);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[0] = "completed";
        next[1] = "active";
        return next;
      });
      setLabConsoleMsg("Analyzing customer behavioral features & historical transaction vector...");

      // Step 2: Signals Analyzed
      const analyzeRes = await fetch(`${API_BASE}/lab/analyze?txn_id=${id}`);
      if (!analyzeRes.ok) throw new Error("Analysis failed");
      const analyzeData = await analyzeRes.json();
      setLabAnalysis(analyzeData.analysis);
      setLabTxn(analyzeData.transaction);

      await sleep(400);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[1] = "completed";
        next[2] = "active";
        return next;
      });
      setLabConsoleMsg("Running Random Forest prediction model for probability estimation...");

      // Step 3 & 4: Probability & Expected value
      await sleep(400);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[2] = "completed";
        next[3] = "active";
        return next;
      });
      setLabConsoleMsg(`Recovery Probability: ${(analyzeData.analysis.recovery_probability * 100).toFixed(0)}%. Computing Priority Index...`);

      // Step 5: Priority score
      await sleep(400);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[3] = "completed";
        next[4] = "active";
        return next;
      });
      setLabConsoleMsg(`Priority Score: ${analyzeData.analysis.priority_score.toFixed(0)}. Evaluating action strategies...`);

      // Step 6 & 7: Strategy selection
      await sleep(400);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[4] = "completed";
        next[5] = "active";
        return next;
      });
      await sleep(300);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[5] = "completed";
        next[6] = "active";
        return next;
      });
      setLabConsoleMsg(`Selected Strategy: ${analyzeData.analysis.recommended_action.replace("_", " ").toUpperCase()}`);

      // Step 8: Policy Engine validation
      await sleep(400);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[6] = "completed";
        next[7] = "active";
        return next;
      });
      setLabConsoleMsg("Validating selected action against active merchant guardrails...");

      const policyRes = await fetch(`${API_BASE}/lab/policy-check?txn_id=${id}`);
      const policyData = await policyRes.json();
      setLabPolicyCheck(policyData);

      await sleep(500);
      if (!policyData.is_approved) {
        setLabStepStatus((prev) => {
          const next = [...prev];
          next[7] = "failed";
          return next;
        });
        setLabConsoleMsg(`Action Blocked: ${policyData.block_reason}`);
        const execRes = await fetch(`${API_BASE}/lab/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txn_id: id }),
        });
        const execData = await execRes.json();
        setLabOutcome(execData);
        try {
          const refreshedTxnRes = await fetch(`${API_BASE}/lab/analyze?txn_id=${id}`);
          if (refreshedTxnRes.ok) {
            const refreshedData = await refreshedTxnRes.json();
            setLabTxn(refreshedData.transaction);
          }
        } catch (e) {
          console.error(e);
        }
        setLabRunning(false);
        return;
      }

      setLabStepStatus((prev) => {
        const next = [...prev];
        next[7] = "completed";
        next[8] = "active";
        return next;
      });
      setLabConsoleMsg(`Guardrails PASSED. Executing recovery action '${analyzeData.analysis.recommended_action}'...`);

      // Step 9: Action executed
      const executeRes = await fetch(`${API_BASE}/lab/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txn_id: id }),
      });
      const executeData = await executeRes.json();
      setLabOutcome(executeData);
      try {
        const refreshedTxnRes = await fetch(`${API_BASE}/lab/analyze?txn_id=${id}`);
        if (refreshedTxnRes.ok) {
          const refreshedData = await refreshedTxnRes.json();
          setLabTxn(refreshedData.transaction);
        }
      } catch (e) {
        console.error(e);
      }

      await sleep(500);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[8] = "completed";
        next[9] = "active";
        return next;
      });
      setLabConsoleMsg("Verifying execution outcome & updating audit ledger...");

      await sleep(400);
      setLabStepStatus((prev) => {
        const next = [...prev];
        next[9] = "completed";
        return next;
      });
      setLabConsoleMsg(`Workflow Complete. Outcome: ${executeData.status.replace("_", " ").toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setLabConsoleMsg("Workflow execution error.");
    } finally {
      setLabRunning(false);
    }
  };

  const getTelemetrySummary = () => {
    if (!labOutcome) return null;
    const status = labOutcome.status;
    const amount = labTxn ? labTxn.amount : 0;
    const formatAmt = (val: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

    let badgeColor = "bg-rose-950/40 text-rose-400 border-rose-800/60";
    let statusTitle = "FAILED ATTEMPT";
    let diagnostic = labOutcome.steps?.[labOutcome.steps.length - 1]?.message || "Retry attempt was rejected by issuing gateway.";
    let impact = `Transaction amount ${formatAmt(amount)} remains at risk.`;
    let nextAction = "Cooldown period active (4 hrs). Recommended next action: Trigger Alternative Payment Link (UPI / NetBanking).";

    if (status === "recovered") {
      badgeColor = "bg-emerald-950/40 text-emerald-400 border-emerald-800/60";
      statusTitle = "RECOVERED";
      diagnostic = `Payment recovered successfully via automated ${labOutcome.analysis?.recommended_action?.replace("_", " ") || "recovery strategy"}.`;
      impact = `Revenue restored: +${formatAmt(amount)}. Success recorded in audit ledger.`;
      nextAction = "Lifecycle complete. Case resolved and customer account restored to active standing.";
    } else if (status === "blocked_by_policy") {
      badgeColor = "bg-amber-950/40 text-amber-400 border-amber-800/60";
      statusTitle = "BLOCKED BY POLICY";
      diagnostic = `Merchant guardrail triggered: ${labOutcome.blocked_reason || "Safety threshold reached"}.`;
      impact = `Automated action halted. Protected customer relationship from excessive retry fatigue.`;
      nextAction = "Review guardrail thresholds under 'Policy & Guardrails' or grant manual operator approval in Queue.";
    } else if (status === "escalated_to_human") {
      badgeColor = "bg-blue-950/40 text-blue-400 border-blue-800/60";
      statusTitle = "ESCALATED TO HUMAN";
      diagnostic = `High-value exposure (${formatAmt(amount)}) or degradation flagged by AI intelligence layer.`;
      impact = `Bypassed robotic retries to preserve VIP customer trust and avoid friction.`;
      nextAction = "Assigned to Operations Support Desk for personalized manual outreach (Phone/Email).";
    } else if (status === "ignored_by_customer") {
      badgeColor = "bg-zinc-900 text-zinc-400 border-zinc-700";
      statusTitle = "IGNORED BY CUSTOMER";
      diagnostic = "Customer opened checkout recovery link but did not complete transaction within TTL window.";
      impact = `${formatAmt(amount)} remains unpaid in checkout abandonment pipeline.`;
      nextAction = "Schedule secondary reminder cadence with discount incentive after 24h cooldown.";
    } else {
      // failed_attempt
      const retryNow = labTxn?.retry_count || 1;
      const maxRetries = policies?.max_retries || 2;
      diagnostic = labTxn?.failure_reason === "insufficient_funds"
        ? "Issuing bank rejected retry: Customer account balance remains insufficient."
        : labOutcome.steps?.[labOutcome.steps.length - 1]?.message || "Retry attempt rejected by gateway.";
      impact = `Amount ${formatAmt(amount)} remains at risk. Retry attempt ${retryNow} of ${maxRetries} registered in ledger.`;
      nextAction = retryNow >= maxRetries
        ? "Maximum retry limit reached. Escalating to alternative payment link (UPI) or VIP support desk."
        : "Cooldown period active (4 hrs). Recommended next action: Prompt customer with 1-click UPI payment link.";
    }

    return { statusTitle, badgeColor, diagnostic, impact, nextAction };
  };

  const handleLabReset = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/lab/reset?txn_id=${id}`);
      const data = await res.json();
      setLabTxn(data);
      setLabAnalysis(null);
      setLabPolicyCheck(null);
      setLabOutcome(null);
      setLabConsoleMsg("Transaction state reset. Ready for AI analysis.");
      setLabStepStatus(Array(10).fill("pending"));
    } catch (e) {
      console.error(e);
    }
  };

  const runBatchSimulation = async () => {
    setBatchRunning(true);
    setBatchProgress(15);
    setBatchOutcome(null);
    try {
      const interval = setInterval(() => {
        setBatchProgress((p) => {
          if (p >= 90) {
            clearInterval(interval);
            return 90;
          }
          return p + 25;
        });
      }, 250);

      const res = await fetch(`${API_BASE}/batch-simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: batchCount }),
      });
      
      clearInterval(interval);
      setBatchProgress(100);

      if (res.ok) {
        const data = await res.json();
        setBatchOutcome(data);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBatchRunning(false);
    }
  };

  const handleSystemReset = async () => {
    if (!window.confirm("Are you sure you want to reset the database to the original seeded state (seed 42)?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/db/reset`, { method: "POST" });
      if (res.ok) {
        alert("Database reset successfully.");
        setLabTxnId("");
        setLabTxn(null);
        setLabAnalysis(null);
        setLabPolicyCheck(null);
        setLabOutcome(null);
        setLabStepStatus(Array(10).fill("pending"));
        setLabConsoleMsg("Sandbox ready.");
        await fetchAllData();
      } else {
        alert("Reset failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Error resetting database.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      recovered: "bg-emerald-950/40 text-brandGreen border border-emerald-800/60 font-mono",
      failed: "bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono",
      failed_attempt: "bg-rose-950/40 text-brandRed border border-rose-900/60 font-mono",
      ignored_by_customer: "bg-amber-950/30 text-brandYellow border border-amber-800/40 font-mono",
      escalated_to_human: "bg-blue-950/40 text-brandBlue border border-blue-900/60 font-mono",
      blocked_by_policy: "bg-amber-950/50 text-brandYellow border border-amber-800/80 font-mono",
      stopped: "bg-zinc-950 text-zinc-500 border border-zinc-900 font-mono",
    };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${styles[status] || styles.failed}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bgDark text-textLight flex flex-col font-sans selection:bg-brandBlue/30 selection:text-white">
      {/* Executive Header Bar */}
      <header className="border-b border-borderDark/80 bg-bgCard px-6 py-3.5 flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-brandBlue flex items-center justify-center font-black text-lg text-white shadow-md shadow-brandBlue/30">
            R
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black tracking-tight text-white uppercase">REVENUELEAK AI</h1>
              <span className="bg-emerald-950/40 text-brandGreen border border-emerald-800/40 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brandGreen animate-pulse"></span>
                <span>ENGINE LIVE • SEED 42</span>
              </span>
            </div>
            <p className="text-[11px] text-textMuted font-medium">Revenue Recovery Intelligence Command Center</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setShowBatchModal(true);
              setBatchOutcome(null);
            }}
            className="flex items-center space-x-2 bg-brandBlue hover:bg-brandBlueHover text-white px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition-all duration-200 uppercase shadow-md shadow-brandBlue/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Batch Simulator</span>
          </button>
          <button
            onClick={handleSystemReset}
            title="Reset Database to Seed 42 State"
            className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 hover:text-brandRed text-textMuted border border-borderDark px-3 py-2 rounded-lg font-bold text-xs transition-all uppercase"
          >
            <History className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
          <button
            onClick={fetchAllData}
            title="Refresh Data"
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-textMuted hover:text-white rounded-lg border border-borderDark transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-brandRed rounded-lg border border-borderDark transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-64 border-r border-borderDark/80 bg-bgCard/30 p-4 space-y-2 flex flex-col justify-between z-20">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "overview" ? "bg-brandBlue/15 text-brandBlue border-l-4 border-brandBlue font-extrabold shadow-sm" : "text-textMuted hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("leak-map")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "leak-map" ? "bg-brandBlue/15 text-brandBlue border-l-4 border-brandBlue font-extrabold shadow-sm" : "text-textMuted hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Revenue Leak Map</span>
            </button>
            <button
              onClick={() => setActiveTab("lab")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "lab" ? "bg-brandBlue/15 text-brandBlue border-l-4 border-brandBlue font-extrabold shadow-sm" : "text-textMuted hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>AI Recovery Lab</span>
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "queue" ? "bg-brandBlue/15 text-brandBlue border-l-4 border-brandBlue font-extrabold shadow-sm" : "text-textMuted hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Recovery Queue</span>
            </button>
            <button
              onClick={() => setActiveTab("policies")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "policies" ? "bg-brandBlue/15 text-brandBlue border-l-4 border-brandBlue font-extrabold shadow-sm" : "text-textMuted hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Policy & Guardrails</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === "audit" ? "bg-brandBlue/15 text-brandBlue border-l-4 border-brandBlue font-extrabold shadow-sm" : "text-textMuted hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </div>

          <div className="p-3.5 bg-zinc-950/80 border border-borderDark rounded-xl text-[11px] text-textMuted leading-relaxed">
            <div className="font-bold text-white flex items-center space-x-1.5 mb-1 font-mono uppercase text-[10px]">
              <Shield className="w-3.5 h-3.5 text-brandBlue" />
              <span>Policy Guardrails</span>
            </div>
            Merchant rules active. All automated actions are verified against retry limits & confidence thresholds.
          </div>
        </nav>

        {/* Primary Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
          {loading && !stats ? (
            <div className="h-full flex items-center justify-center flex-col space-y-4">
              <RefreshCw className="w-8 h-8 text-brandBlue animate-spin" />
              <p className="text-textMuted font-bold text-xs uppercase tracking-wider font-mono">Initializing Telemetry Engine...</p>
            </div>
          ) : !stats ? (
            <div className="h-full flex items-center justify-center flex-col space-y-4 border border-dashed border-zinc-800 rounded-xl p-12 bg-bgCard/20">
              <AlertTriangle className="w-12 h-12 text-brandRed" />
              <h3 className="text-lg font-bold text-white">Backend Offline</h3>
              <p className="text-xs text-textMuted max-w-md text-center leading-relaxed">
                Could not connect to FastAPI server at <code className="text-brandBlue font-mono">http://localhost:8000</code>.
              </p>
              <button
                onClick={fetchAllData}
                className="px-4 py-2 bg-brandBlue text-white font-bold text-xs rounded-lg transition uppercase tracking-wider"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {/* PAGE 1: OVERVIEW */}
              {activeTab === "overview" && (
                <PageTransition trigger={activeTab} direction="slide-up">
                  <div className="space-y-8">
                    {/* Header Banner */}
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-white">System Command Center</h2>
                        <p className="text-xs text-textMuted">Real-time operational health, at-risk exposures, and AI-scored recovery potential.</p>
                      </div>
                    </div>                    {/* KPI CARDS WITH PRIMARY METRIC HIERARCHY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Primary 1: Estimated Recoverable Revenue */}
                      <div className="bg-gradient-to-br from-brandBlue/20 via-bgCard to-bgCard border border-brandBlue/40 p-5 rounded-xl relative overflow-hidden shadow-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-brandBlue uppercase tracking-wider bg-brandBlue/15 px-2 py-0.5 rounded border border-brandBlue/30">
                              PRIMARY TARGET
                            </span>
                            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mt-2.5">Expected Recovery</h3>
                          </div>
                          <Sparkles className="w-4 h-4 text-brandBlue" />
                        </div>
                        <div className="mt-3">
                          <h2 className="text-3xl font-black font-mono tracking-tight text-white">{formatCurrency(stats.expected_recovery_value)}</h2>
                          <p className="text-[10px] text-brandGreen font-mono font-bold mt-1.5 flex items-center space-x-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>AI-scored recoverable pipeline</span>
                          </p>
                        </div>
                      </div>

                      {/* Primary 2: Revenue At Risk */}
                      <div className="bg-bgCard border border-borderDark p-5 rounded-xl flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-center text-textMuted text-[10px] font-mono font-bold uppercase tracking-wider">
                          <span>Revenue At Risk</span>
                          <AlertTriangle className="w-4 h-4 text-brandRed" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-3xl font-black font-mono text-white">{formatCurrency(stats.revenue_at_risk)}</h3>
                          <p className="text-[10px] text-brandRed font-mono font-bold mt-1.5">Active leak exposure across stages</p>
                        </div>
                      </div>

                      {/* Primary 3: Recovered Revenue */}
                      <div className="bg-bgCard border border-borderDark p-5 rounded-xl flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-center text-textMuted text-[10px] font-mono font-bold uppercase tracking-wider">
                          <span>Recovered Revenue</span>
                          <CheckCircle2 className="w-4 h-4 text-brandGreen" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-3xl font-black font-mono text-brandGreen">{formatCurrency(stats.revenue_recovered)}</h3>
                          <p className="text-[10px] text-brandGreen font-mono font-bold mt-1.5">Capital restored via automated actions</p>
                        </div>
                      </div>

                      {/* Primary 4: Recovery Efficiency Rate */}
                      <div className="bg-bgCard border border-borderDark p-5 rounded-xl flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-center text-textMuted text-[10px] font-mono font-bold uppercase tracking-wider">
                          <span>Recovery Rate</span>
                          <span className="text-[10px] font-mono text-textMuted">Overall</span>
                        </div>
                        <div className="mt-3">
                          <h3 className="text-3xl font-black font-mono text-brandGreen">{stats.recovery_rate}%</h3>
                          <div className="w-full bg-zinc-900 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div className="bg-brandGreen h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.recovery_rate)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* OVERVIEW CENTERPIECE: RevenueFlow Sankey Component */}
                    <div className="w-full">
                      <RevenueFlow
                        atRisk={stats.revenue_at_risk}
                        recovered={stats.revenue_recovered}
                        opportunity={stats.expected_recovery_value}
                      />
                    </div>

                    {/* High-priority leaks table and audit feed */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-bgCard border border-borderDark rounded-xl p-6 shadow-md">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-brandRed"></span>
                            <span>High-Priority Outstanding Opportunities</span>
                          </h4>
                          <span className="text-[10px] font-mono text-textMuted">Top 5 Unresolved</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-borderDark text-textMuted uppercase font-mono text-[10px]">
                                <th className="py-3 px-2">Case ID</th>
                                <th className="py-3">Leak Type</th>
                                <th className="py-3 text-right">Amount</th>
                                <th className="py-3 text-center">Score</th>
                                <th className="py-3">Recommended Strategy</th>
                                <th className="py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.high_priority_leaks.map((leak) => (
                                <tr key={leak.id} className="border-b border-borderDark/40 hover:bg-zinc-900/40 transition">
                                  <td className="py-3 px-2 font-mono font-bold text-white">{leak.id}</td>
                                  <td className="py-3 capitalize text-textMuted">{leak.leak_type.replace("_", " ")}</td>
                                  <td className="py-3 text-right font-mono font-bold text-white">{formatCurrency(leak.amount)}</td>
                                  <td className="py-3 text-center">
                                    <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-brandYellow font-mono font-bold text-[10px]">
                                      {leak.priority_score.toFixed(0)}
                                    </span>
                                  </td>
                                  <td className="py-3 text-xs capitalize text-textMuted">{leak.recommended_action.replace("_", " ")}</td>
                                  <td className="py-3 text-right">
                                    <button
                                      onClick={() => {
                                        setLabTxnId(leak.id);
                                        handleLabReset(leak.id);
                                        setActiveTab("lab");
                                      }}
                                      className="px-2.5 py-1 bg-brandBlue/15 hover:bg-brandBlue text-brandBlue hover:text-white border border-brandBlue/30 rounded text-[10px] font-bold uppercase transition flex items-center space-x-1 float-right"
                                    >
                                      <FlaskConical className="w-3 h-3" />
                                      <span>Inspect</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Audit Monitor Feed */}
                      <div className="bg-bgCard border border-borderDark rounded-xl p-6 shadow-md">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-brandBlue" />
                          <span>Audit Telemetry Stream</span>
                        </h4>
                        <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
                          {stats.activity_feed.map((feed, idx) => (
                            <div key={idx} className="border-l-2 border-zinc-800 pl-3 py-1 space-y-1 text-xs">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono text-zinc-500">{new Date(feed.timestamp).toLocaleTimeString()}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  feed.event_type.includes("SUCCESS") ? "bg-emerald-950/40 text-brandGreen border border-emerald-800/40" :
                                  feed.event_type.includes("BLOCKED") ? "bg-amber-950/40 text-brandYellow border border-amber-800/40" :
                                  "bg-zinc-900 text-zinc-400"
                                }`}>
                                  {feed.event_type}
                                </span>
                              </div>
                              <p className="text-textMuted leading-snug">{feed.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Model Performance & Governance Transparency Card */}
                    <div className="bg-bgCard border border-borderDark rounded-xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-3 gap-2">
                        <div className="flex items-center space-x-2">
                          <BrainCircuit className="w-4 h-4 text-brandBlue" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">AI Intelligence Engine & Model Governance</h4>
                        </div>
                        <span className="text-[10px] font-mono text-textMuted bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                          Prototype model trained on synthetic transaction data
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs font-mono">
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                          <p className="text-[10px] text-textMuted uppercase">Model Architecture</p>
                          <p className="font-bold text-white mt-0.5">Random Forest Classifier</p>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                          <p className="text-[10px] text-textMuted uppercase">Validation Accuracy</p>
                          <p className="font-bold text-brandGreen mt-0.5">~68.2%</p>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                          <p className="text-[10px] text-textMuted uppercase">ROC-AUC Score</p>
                          <p className="font-bold text-brandBlue mt-0.5">~0.76</p>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                          <p className="text-[10px] text-textMuted uppercase">Training Corpus</p>
                          <p className="font-bold text-white mt-0.5">600 Privacy-Safe Records</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </PageTransition>
              )}

              {/* PAGE 2: REVENUE LEAK MAP */}
              {activeTab === "leak-map" && leakMapData && (
                <PageTransition trigger={activeTab} direction="slide-up">
                  <div className="space-y-8 relative">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">Revenue Pipeline Funnel Map</h2>
                      <p className="text-xs text-textMuted">Investigative pipeline stages. Click any channel to open the deep-dive analysis sheet.</p>
                    </div>

                    <LeakMap
                      data={leakMapData}
                      onSelectNode={openCategoryDetails}
                      selectedNode={sheetCategory}
                    />

                    {/* Side-sheet drawer */}
                    {sheetCategory && (
                      <div className="bg-bgCard border-l-4 border-brandBlue border border-borderDark rounded-xl p-6 mt-8 animate-fadeIn relative shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-brandBlue uppercase tracking-wider">Channel Deep-Dive</span>
                            <h3 className="text-xl font-black text-white capitalize">{sheetCategory.replace("_", " ")}</h3>
                          </div>
                          <button
                            onClick={() => setSheetCategory(null)}
                            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-textMuted border border-zinc-800 rounded"
                          >
                            Close Details
                          </button>
                        </div>

                        {sheetLoading ? (
                          <div className="h-40 flex items-center justify-center space-x-2">
                            <RefreshCw className="w-5 h-5 text-brandBlue animate-spin" />
                            <span className="text-xs text-textMuted">Compiling channel analytics...</span>
                          </div>
                        ) : (
                          sheetDetails && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="bg-zinc-950 p-5 rounded-lg border border-borderDark space-y-4">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Priority Summary</h4>
                                <p className="text-xs text-textMuted leading-relaxed">{sheetDetails.why_prioritized}</p>
                                <div className="pt-4 border-t border-zinc-900 space-y-2.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-textMuted">Priority Score</span>
                                    <span className="font-mono font-bold text-brandYellow">{leakMapData[sheetCategory].priority_score}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-textMuted">Potential Recovery</span>
                                    <span className="font-mono font-bold text-brandGreen">{formatCurrency(leakMapData[sheetCategory].expected_recovery_value)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-zinc-950 p-5 rounded-lg border border-borderDark">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Top Opportunities</h4>
                                <div className="space-y-2.5">
                                  {sheetDetails.top_transactions.map((txn: any) => (
                                    <div key={txn.id} className="flex justify-between items-center border-b border-zinc-900 pb-2 text-xs">
                                      <div>
                                        <p className="font-mono font-bold text-white">{txn.id}</p>
                                        <p className="text-[10px] text-textMuted capitalize">Action: {txn.recommended_action.replace("_", " ")}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-mono font-bold text-white">{formatCurrency(txn.amount)}</p>
                                        <p className="text-[10px] text-brandYellow font-mono font-bold">Priority: {txn.priority_score.toFixed(0)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-zinc-950 p-5 rounded-lg border border-borderDark space-y-4">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Strategy Distribution</h4>
                                <div className="space-y-2">
                                  {sheetDetails.strategies.map((strat: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                      <span className="text-textMuted capitalize">{strat.action}</span>
                                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                        {strat.count} cases
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </PageTransition>
              )}

              {/* PAGE 3: AI RECOVERY LAB */}
              {activeTab === "lab" && (
                <PageTransition trigger={activeTab} direction="slide-up">
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">AI Recovery Sandbox</h2>
                      <p className="text-xs text-textMuted">Simulate, inspect policy guardrails, and observe orchestrator state decisions.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Selection & AI Decision Panel */}
                      <div className="bg-bgCard border border-borderDark rounded-xl p-6 space-y-5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                            <Sliders className="w-4 h-4 text-brandBlue" />
                            <span>AI Recovery Controls</span>
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-textMuted">
                            Sandbox Mode
                          </span>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-textMuted">Select Unresolved Case</label>
                          <div className="flex space-x-2">
                            <select
                              value={labTxnId}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                setLabTxnId(selectedId);
                                const found = queue.find((t) => t.id === selectedId) || null;
                                setLabTxn(found);
                                setLabAnalysis(null);
                                setLabPolicyCheck(null);
                                setLabOutcome(null);
                              }}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-brandBlue"
                            >
                              <option value="">-- Choose Transaction --</option>
                              {queue
                                .filter((t) => t.status !== "recovered")
                                .slice(0, 35)
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.id} - ₹{t.amount.toLocaleString("en-IN")} ({t.leak_type.replace(/_/g, " ")})
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleLabReset(labTxnId)}
                              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:bg-zinc-800 font-bold text-textMuted hover:text-white transition"
                            >
                              Reset
                            </button>
                          </div>

                          {labTxnId && (
                            <button
                              onClick={() => runLabRecoveryWorkflow(labTxnId)}
                              disabled={labRunning}
                              className="w-full py-3 bg-brandBlue hover:bg-brandBlueHover text-white font-bold text-xs tracking-wider transition-all rounded-lg uppercase flex items-center justify-center space-x-2 shadow-lg shadow-brandBlue/20 disabled:opacity-50"
                            >
                              {labRunning ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Orchestrator Running...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 fill-current" />
                                  <span>Run AI Recovery Analysis</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {labTxn && (
                          <div className="space-y-4 pt-2 border-t border-zinc-900">
                            {/* 1. Case Summary */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textMuted">01. Case Summary</span>
                                <span className="font-mono text-[10px] text-zinc-400">ID: {labTxn.id}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                                <div>
                                  <p className="text-[10px] text-textMuted">Amount at Risk</p>
                                  <p className="font-bold font-mono text-white text-sm">{formatCurrency(labTxn.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-textMuted">Leak Type</p>
                                  <p className="font-bold capitalize text-zinc-300 text-[11px] truncate">{labTxn.leak_type.replace(/_/g, " ")}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-textMuted">Payment Method</p>
                                  <p className="font-mono text-zinc-300 text-[11px]">{labTxn.payment_method}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-textMuted">Retry Exposure</p>
                                  <p className="font-mono text-zinc-300 text-[11px]">{labTxn.retry_count} prior attempts</p>
                                </div>
                              </div>
                            </div>

                            {/* 2. AI Assessment & Expected Value */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textMuted">02. AI Assessment</span>
                                <span className="text-[10px] font-bold text-brandBlue uppercase">
                                  {labAnalysis ? "Analysis Complete" : "Baseline Estimate"}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                                <div>
                                  <p className="text-[9px] text-textMuted uppercase">Recovery Prob.</p>
                                  <p className="font-mono font-bold text-brandGreen text-sm">
                                    {((labAnalysis ? labAnalysis.recovery_probability : labTxn.recovery_probability) * 100).toFixed(0)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-textMuted uppercase">Decision Conf.</p>
                                  <p className="font-mono font-bold text-brandBlue text-sm">
                                    {((labAnalysis ? labAnalysis.confidence : labTxn.confidence) * 100).toFixed(0)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-textMuted uppercase">Expected Val.</p>
                                  <p className="font-mono font-bold text-white text-sm">
                                    {formatCurrency(labAnalysis ? labAnalysis.expected_recovery_value : labTxn.expected_recovery_value)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* 3. Decision Signals ("WHY THIS DECISION?") */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-1.5">
                                <BrainCircuit className="w-3.5 h-3.5 text-brandYellow" />
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">Why This Decision? (Signals)</span>
                              </div>
                              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-xs">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-textMuted">Customer Success Rate:</span>
                                  <span className="font-mono font-bold text-emerald-400">{(labTxn.customer_success_rate * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-textMuted">Failure Diagnostic:</span>
                                  <span className="font-mono font-bold text-rose-400 capitalize truncate max-w-[130px]">{labTxn.failure_reason.replace(/_/g, " ")}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-textMuted">Strategy Selection:</span>
                                  <span className="font-mono font-bold text-brandBlue capitalize">
                                    {(labAnalysis ? labAnalysis.recommended_action : labTxn.recommended_action).replace(/_/g, " ")}
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-zinc-900/80 text-[11px] text-zinc-300 leading-relaxed">
                                  <span className="text-zinc-500 font-mono text-[10px] uppercase block mb-0.5">Decision Rationale:</span>
                                  {labAnalysis?.reason_summary || "Multi-signal evaluation balances recovery yield against customer churn risk and gateway retry penalties."}
                                </div>
                              </div>
                            </div>

                            {/* 4. Policy Guardrail Status */}
                            {labPolicyCheck && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-textMuted">04. Policy Guardrail</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                    labPolicyCheck.is_approved
                                      ? "bg-emerald-950/40 text-brandGreen border border-emerald-800/40"
                                      : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                                  }`}>
                                    {labPolicyCheck.is_approved ? "APPROVED" : "BLOCKED"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                                  {labPolicyCheck.block_reason || "All merchant safety boundaries passed (retries, confidence & high-value caps)."}
                                </p>
                              </div>
                            )}

                            {/* 5. Simulation Transparency Notice */}
                            <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-2.5 flex items-start space-x-2 text-[10px] text-blue-300/80 leading-normal">
                              <Info className="w-3.5 h-3.5 text-brandBlue shrink-0 mt-0.5" />
                              <span>
                                <strong>Simulated Execution</strong>: Actions run against the offline orchestrator simulation. No actual bank transfers or customer messages are dispatched.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 6-Stage Visual Journey */}
                      <div className="lg:col-span-2 bg-bgCard border border-borderDark rounded-xl p-6 flex flex-col justify-between shadow-xl">
                        <div className="space-y-6">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-brandBlue" />
                            <span>AI Decision Node Map</span>
                          </h4>

                          <RecoveryGraph
                            stepStatus={labStepStatus}
                            analysis={labAnalysis}
                            policyCheck={labPolicyCheck}
                            outcome={labOutcome}
                          />
                        </div>

                        {/* Console Telemetry Card */}
                        <div className="mt-6 bg-zinc-950 p-5 border border-zinc-900 rounded-xl font-mono text-xs space-y-3 shadow-lg">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted">Console Telemetry & Decision Brief</span>
                              {labRunning && <span className="w-1.5 h-1.5 rounded-full bg-brandBlue animate-ping"></span>}
                            </div>
                            {(() => {
                              const telemetry = getTelemetrySummary();
                              return telemetry ? (
                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${telemetry.badgeColor}`}>
                                  {telemetry.statusTitle}
                                </span>
                              ) : null;
                            })()}
                          </div>

                          {labRunning ? (
                            <div className="py-2 flex items-center space-x-2 text-brandBlue">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{labConsoleMsg}</span>
                            </div>
                          ) : (() => {
                            const telemetry = getTelemetrySummary();
                            return telemetry ? (
                              <div className="space-y-2.5 pt-1">
                                <div className="flex items-start space-x-2.5">
                                  <span className="text-brandBlue font-bold shrink-0">01. DIAGNOSTIC:</span>
                                  <span className="text-zinc-300 leading-relaxed">{telemetry.diagnostic}</span>
                                </div>
                                <div className="flex items-start space-x-2.5">
                                  <span className="text-brandYellow font-bold shrink-0">02. IMPACT:</span>
                                  <span className="text-zinc-300 leading-relaxed">{telemetry.impact}</span>
                                </div>
                                <div className="flex items-start space-x-2.5">
                                  <span className="text-brandGreen font-bold shrink-0">03. NEXT STEP:</span>
                                  <span className="text-zinc-300 leading-relaxed">{telemetry.nextAction}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="min-h-[20px] text-zinc-500">{labConsoleMsg || "Awaiting execution trigger... Select an unresolved case and click 'Run AI Recovery Analysis'."}</p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </PageTransition>
              )}

              {/* PAGE 4: RECOVERY QUEUE */}
              {activeTab === "queue" && (
                <PageTransition trigger={activeTab} direction="slide-up">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">Recovery Opportunities Queue</h2>
                      <p className="text-xs text-textMuted">Operations worklist prioritized by AI Expected Recovery Value and Urgency.</p>
                    </div>

                    <div className="bg-bgCard border border-borderDark p-4 rounded-xl flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4">
                      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-textMuted" />
                          <input
                            type="text"
                            placeholder="Search Case ID / Customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brandBlue"
                          />
                        </div>

                        <select
                          value={filterLeakType}
                          onChange={(e) => setFilterLeakType(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:w-auto font-mono"
                        >
                          <option value="">All Leak Types</option>
                          <option value="payment_failure">Payment Failures</option>
                          <option value="checkout_abandonment">Checkout Abandonment</option>
                          <option value="failed_subscription">Failed Subscriptions</option>
                          <option value="overdue_invoice">Overdue Invoices</option>
                        </select>

                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none w-full md:w-auto font-mono"
                        >
                          <option value="">All Statuses</option>
                          <option value="unresolved">Unresolved Only</option>
                          <option value="recovered">Recovered</option>
                          <option value="failed_attempt">Failed Attempts</option>
                          <option value="ignored_by_customer">Ignored</option>
                          <option value="escalated_to_human">Escalated</option>
                          <option value="blocked_by_policy">Blocked by Policy</option>
                        </select>
                      </div>

                      <span className="text-xs text-textMuted font-mono">
                        {queue.length} cases found
                      </span>
                    </div>

                    <div className="bg-bgCard border border-borderDark rounded-xl overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-borderDark bg-bgCard/80 text-textMuted font-bold uppercase tracking-wider font-mono text-[10px]">
                              <th className="py-4 px-4">Case ID</th>
                              <th className="py-4">Leak Type</th>
                              <th className="py-4 text-right">Amount at Risk</th>
                              <th className="py-4 text-right">Expected Recovery</th>
                              <th className="py-4 text-center">Rec. Prob.</th>
                              <th className="py-4 text-center">Priority</th>
                              <th className="py-4">Recommended Action</th>
                              <th className="py-4">Status</th>
                              <th className="py-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {queue.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="py-8 text-center text-textMuted">
                                  No matching recovery cases found.
                                </td>
                              </tr>
                            ) : (
                              queue.map((item) => (
                                <tr key={item.id} className="border-b border-borderDark/40 hover:bg-zinc-900/40 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-white">{item.id}</td>
                                  <td className="py-3 capitalize text-textMuted">{item.leak_type.replace(/_/g, " ")}</td>
                                  <td className="py-3 text-right font-mono font-bold text-white">{formatCurrency(item.amount)}</td>
                                  <td className="py-3 text-right font-mono font-bold text-brandGreen">{formatCurrency(item.expected_recovery_value)}</td>
                                  <td className="py-3 text-center font-mono font-bold text-brandGreen">{(item.recovery_probability * 100).toFixed(0)}%</td>
                                  <td className="py-3 text-center">
                                    <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-brandYellow font-mono font-bold text-[10px]">
                                      {item.priority_score.toFixed(0)}
                                    </span>
                                  </td>
                                  <td className="py-3 text-xs capitalize text-textMuted">{item.recommended_action.replace(/_/g, " ")}</td>
                                  <td className="py-3">{getStatusBadge(item.status)}</td>
                                  <td className="py-3 text-center">
                                    <button
                                      onClick={() => {
                                        setLabTxnId(item.id);
                                        setLabTxn(item);
                                        handleLabReset(item.id);
                                        setActiveTab("lab");
                                      }}
                                      className="px-2.5 py-1 bg-brandBlue/10 hover:bg-brandBlue/20 text-brandBlue border border-brandBlue/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1.5 mx-auto shadow-sm"
                                      title="Open Case in AI Recovery Lab"
                                    >
                                      <FlaskConical className="w-3 h-3" />
                                      <span>Open in Lab</span>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </PageTransition>
              )}

              {/* PAGE 5: POLICY & GUARDRAILS */}
              {activeTab === "policies" && policies && (
                <PageTransition trigger={activeTab} direction="slide-up">
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">Recovery Policy Guardrails</h2>
                      <p className="text-xs text-textMuted">Configure merchant safety boundaries. Prevent high-friction customer actions automatically.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <form onSubmit={handlePolicySave} className="bg-bgCard border border-borderDark rounded-xl p-6 space-y-5 lg:col-span-1 shadow-lg">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                          <Sliders className="w-4 h-4 text-brandBlue" />
                          <span>Rule Configuration</span>
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-textMuted mb-2">Max Automatic Retries</label>
                            <input
                              type="number"
                              value={policyForm.max_retries}
                              onChange={(e) => setPolicyForm({ ...policyForm, max_retries: parseInt(e.target.value) })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brandBlue font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-textMuted mb-2">Min Decision Confidence Threshold (0.00 – 1.00)</label>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              value={policyForm.min_confidence}
                              onChange={(e) => setPolicyForm({ ...policyForm, min_confidence: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brandBlue font-mono"
                            />
                            <p className="text-[10px] text-textMuted mt-1">Actions with confidence below this threshold are blocked.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-textMuted mb-2">Reminder Cooldown Window (Hours)</label>
                            <input
                              type="number"
                              min="1"
                              value={policyForm.reminder_cooldown_hours}
                              onChange={(e) => setPolicyForm({ ...policyForm, reminder_cooldown_hours: parseInt(e.target.value) || 0 })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brandBlue font-mono"
                            />
                            <p className="text-[10px] text-textMuted mt-1">Minimum quiet period between customer reminder outreach.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-textMuted mb-2">High Value Threshold (₹)</label>
                            <input
                              type="number"
                              value={policyForm.high_value_threshold}
                              onChange={(e) => setPolicyForm({ ...policyForm, high_value_threshold: parseInt(e.target.value) || 0 })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brandBlue font-mono"
                            />
                            <p className="text-[10px] text-textMuted mt-1">Amounts exceeding this threshold require human intervention.</p>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-semibold text-textMuted">Enable Auto-Recovery</span>
                            <input
                              type="checkbox"
                              checked={policyForm.auto_action_enabled}
                              onChange={(e) => setPolicyForm({ ...policyForm, auto_action_enabled: e.target.checked })}
                              className="w-4 h-4 rounded text-brandBlue bg-zinc-950 border-zinc-800 focus:ring-brandBlue"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-brandBlue hover:bg-brandBlueHover text-white font-bold text-xs tracking-wider transition rounded-lg uppercase shadow-md shadow-brandBlue/20"
                          >
                            Save Policy Guardrails
                          </button>
                        </div>
                      </form>

                      <div className="bg-bgCard border border-borderDark rounded-xl p-6 lg:col-span-2 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                            <Lock className="w-4 h-4 text-brandYellow" />
                            <span>Guardrail Blocked Audit Logs</span>
                          </h4>
                          <span className="bg-amber-950/40 text-brandYellow border border-amber-800/60 px-3 py-1 rounded-full text-xs font-mono font-bold">
                            {blockedCases.length} blocked actions
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-borderDark text-textMuted uppercase font-mono text-[10px]">
                                <th className="py-3 px-1">Case ID</th>
                                <th className="py-3">Type</th>
                                <th className="py-3 text-right">Amount</th>
                                <th className="py-3">Policy Block Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {blockedCases.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-textMuted">
                                    No actions blocked by active guardrails.
                                  </td>
                                </tr>
                              ) : (
                                blockedCases.map((item, idx) => (
                                  <tr key={idx} className="border-b border-borderDark/40 hover:bg-zinc-900/40">
                                    <td className="py-3 px-1 font-mono font-bold text-white">{item.id}</td>
                                    <td className="py-3 capitalize text-textMuted">{item.leak_type.replace("_", " ")}</td>
                                    <td className="py-3 text-right font-mono font-bold text-white">{formatCurrency(item.amount)}</td>
                                    <td className="py-3 text-brandYellow text-xs pr-4">{item.blocked_reason}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </PageTransition>
              )}

              {/* PAGE 6: AUDIT TRAIL */}
              {activeTab === "audit" && (
                <PageTransition trigger={activeTab} direction="slide-up">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">Audit Trail</h2>
                      <p className="text-xs text-textMuted">Traceable audit of every event, AI assessment, policy run, and recovery outcome.</p>
                    </div>

                    <div className="bg-bgCard border border-borderDark rounded-xl overflow-hidden shadow-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-borderDark bg-bgCard/80 text-textMuted font-bold uppercase tracking-wider font-mono text-[10px]">
                              <th className="py-4 px-4">Log #</th>
                              <th className="py-4">Timestamp</th>
                              <th className="py-4">Case ID</th>
                              <th className="py-4">Event Type</th>
                              <th className="py-4 text-center">Guardrail Status</th>
                              <th className="py-4 px-4">Audit Narrative & Outcomes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-textMuted">
                                  No audit events logged.
                                </td>
                              </tr>
                            ) : (
                              auditLogs.map((log) => {
                                const isBlocked = log.event_type.includes("BLOCKED") || log.details?.toLowerCase().includes("blocked");
                                const isPassed = log.event_type.includes("SUCCESS") || log.event_type.includes("GUARDRAIL") || log.event_type.includes("PASSED") || log.event_type.includes("RECOVERED");
                                return (
                                  <tr key={log.id} className="border-b border-borderDark/40 hover:bg-zinc-900/40 transition">
                                    <td className="py-3 px-4 font-mono text-zinc-500">{log.id}</td>
                                    <td className="py-3 font-mono text-textMuted text-[11px]">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="py-3 font-mono font-bold text-white">{log.transaction_id || "SYSTEM"}</td>
                                    <td className="py-3">
                                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${
                                        log.event_type.includes("SUCCESS") || log.event_type.includes("RECOVERED") ? "bg-emerald-950/40 text-brandGreen border-emerald-800/40" :
                                        log.event_type.includes("BLOCKED") ? "bg-amber-950/40 text-brandYellow border-amber-800/40" :
                                        log.event_type.includes("FAIL") ? "bg-rose-950/40 text-rose-400 border-rose-800/40" :
                                        "bg-zinc-900 text-zinc-400 border-zinc-800"
                                      }`}>
                                        {log.event_type}
                                      </span>
                                    </td>
                                    <td className="py-3 text-center">
                                      {isBlocked ? (
                                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-rose-950/40 text-rose-400 border border-rose-800/40">
                                          BLOCKED
                                        </span>
                                      ) : isPassed ? (
                                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-emerald-950/40 text-brandGreen border border-emerald-800/40">
                                          ALLOWED
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 text-[9px] font-mono text-zinc-500">
                                          N/A
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-zinc-300 text-xs font-mono leading-relaxed">{log.details}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </PageTransition>
              )}
            </>
          )}
        </main>
      </div>

      {/* BATCH SIMULATION OVERLAY MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bgCard border border-borderDark w-full max-w-2xl rounded-xl p-6 space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center space-x-2">
                <Play className="w-4 h-4 text-brandBlue fill-current" />
                <span>Simulated Batch Recovery Operations</span>
              </h3>
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchOutcome(null);
                }}
                className="text-textMuted hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {!batchOutcome ? (
              <div className="space-y-6">
                <p className="text-xs text-textMuted leading-relaxed">
                  Generate recovery actions on a batch of outstanding invoices and payment failures. This triggers AI Scoring, runs Policy Engine checks, and records persistent outcome updates.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">Batch Record Count</label>
                  <div className="flex space-x-3">
                    {[25, 50, 100, 250].map((num) => (
                      <button
                        key={num}
                        onClick={() => setBatchCount(num)}
                        className={`flex-1 py-3 rounded-lg border font-mono font-bold text-xs transition ${
                          batchCount === num ? "bg-brandBlue text-white border-brandBlue shadow-md shadow-brandBlue/30" : "bg-bgDark border-borderDark text-textMuted hover:bg-zinc-900"
                        }`}
                      >
                        {num} Records
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={runBatchSimulation}
                  disabled={batchRunning}
                  className="w-full py-3.5 bg-brandBlue hover:bg-brandBlueHover text-white font-bold text-xs tracking-wider transition rounded-lg uppercase flex items-center justify-center space-x-2 shadow-lg shadow-brandBlue/20 disabled:opacity-50"
                >
                  {batchRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Running Batch Actions... ({batchProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Execute Batch Actions</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between bg-zinc-950 px-4 py-2.5 rounded-lg border border-zinc-900">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-brandGreen"></span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                      Batch Execution Results ({batchOutcome.metrics?.processed_count || batchCount} Cases Evaluated)
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brandBlue/20 text-brandBlue border border-brandBlue/30">
                    Scoped Run
                  </span>
                </div>

                {/* Batch-Scoped Core Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-lg">
                    <p className="text-[9px] text-textMuted uppercase font-mono">Batch Risk Volume</p>
                    <p className="text-base font-mono font-bold text-white mt-1">
                      {formatCurrency(batchOutcome.metrics?.batch_revenue_at_risk || 0)}
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-lg">
                    <p className="text-[9px] text-textMuted uppercase font-mono">Batch Recovered</p>
                    <p className="text-base font-mono font-bold text-brandGreen mt-1">
                      +{formatCurrency(batchOutcome.metrics?.batch_recovered_amount || batchOutcome.metrics?.recovered_amount_delta || 0)}
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-lg">
                    <p className="text-[9px] text-textMuted uppercase font-mono">Batch Recovery Rate</p>
                    <p className="text-base font-mono font-bold text-brandGreen mt-1">
                      {batchOutcome.metrics?.batch_recovery_rate ?? 0}%
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-lg">
                    <p className="text-[9px] text-textMuted uppercase font-mono">Successful Recoveries</p>
                    <p className="text-base font-mono font-bold text-white mt-1">
                      {batchOutcome.metrics?.batch_recovered_count || 0} cases
                    </p>
                  </div>
                </div>

                {/* Batch Breakdown Actions */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg">
                    <p className="text-[9px] text-textMuted uppercase font-mono">Failed Retries</p>
                    <p className="text-sm font-mono font-bold text-rose-400 mt-0.5">
                      {batchOutcome.metrics?.batch_failed_count || 0} cases
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg">
                    <p className="text-[9px] text-textMuted uppercase font-mono">Human Escalations</p>
                    <p className="text-sm font-mono font-bold text-brandBlue mt-0.5">
                      {batchOutcome.metrics?.batch_escalated_count || batchOutcome.metrics?.manual_interventions || 0} cases
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg">
                    <p className="text-[9px] text-textMuted uppercase font-mono">Guardrail Blocked</p>
                    <p className="text-sm font-mono font-bold text-brandYellow mt-0.5">
                      {batchOutcome.metrics?.batch_blocked_count || batchOutcome.metrics?.blocked_actions || 0} cases
                    </p>
                  </div>
                </div>

                {/* Macro DB Impact Before vs After */}
                <div className="bg-zinc-950/80 p-4 rounded-lg border border-zinc-900 grid grid-cols-2 gap-4 text-center text-xs">
                  <div className="border-r border-zinc-900 pr-3 space-y-1">
                    <p className="text-[9px] font-mono font-bold text-textMuted uppercase tracking-wider">Overall System (Before)</p>
                    <p className="text-textMuted font-mono">Recovered: <span className="text-white font-bold">{formatCurrency(batchOutcome.before.recovered_value)}</span></p>
                    <p className="text-textMuted font-mono">Rate: <span className="text-white font-bold">{batchOutcome.before.recovery_rate}%</span></p>
                  </div>
                  <div className="pl-3 space-y-1">
                    <p className="text-[9px] font-mono font-bold text-brandGreen uppercase tracking-wider">Overall System (After)</p>
                    <p className="text-textMuted font-mono">Recovered: <span className="text-brandGreen font-bold">{formatCurrency(batchOutcome.after.recovered_value)}</span></p>
                    <p className="text-textMuted font-mono">Rate: <span className="text-brandGreen font-bold">{batchOutcome.after.recovery_rate}%</span></p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <p className="text-[11px] text-textMuted font-mono">
                    Simulated execution committed to SQLite database. Overview updated.
                  </p>
                  <button
                    onClick={() => {
                      setShowBatchModal(false);
                      setBatchOutcome(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-brandBlue hover:bg-brandBlueHover text-white font-bold text-xs tracking-wider transition rounded-lg uppercase shadow-md shadow-brandBlue/20"
                  >
                    Return to Command Center
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
