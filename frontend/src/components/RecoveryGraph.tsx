import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader, Shield, Zap, Search, Lock, Play, Activity } from "lucide-react";

interface StepDetail {
  title: string;
  icon: any;
  subSteps: { index: number; label: string }[];
}

interface RecoveryGraphProps {
  stepStatus: string[]; // 10-step status array: "pending", "active", "completed", "failed"
  analysis: any;
  policyCheck: any;
  outcome: any;
}

export default function RecoveryGraph({ stepStatus, analysis, policyCheck, outcome }: RecoveryGraphProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  useEffect(() => {
    if (outcome) {
      setExpandedStage(5);
    } else {
      setExpandedStage(null);
    }
  }, [outcome]);

  // Group 10 backend steps into 6 user-facing stages
  const stages: StepDetail[] = [
    {
      title: "DETECT",
      icon: Search,
      subSteps: [{ index: 0, label: "Leak signal detected" }]
    },
    {
      title: "ANALYZE",
      icon: Activity,
      subSteps: [
        { index: 1, label: "Customer behavioral signals analyzed" },
        { index: 2, label: "Recovery probability computed" }
      ]
    },
    {
      title: "DECIDE",
      icon: Zap,
      subSteps: [
        { index: 3, label: "Expected recovery value estimated" },
        { index: 4, label: "Priority score calculated" },
        { index: 5, label: "Recovery strategies evaluated" },
        { index: 6, label: "Optimal strategy selected" }
      ]
    },
    {
      title: "VALIDATE",
      icon: Shield,
      subSteps: [{ index: 7, label: "Merchant policy guardrails validated" }]
    },
    {
      title: "EXECUTE",
      icon: Play,
      subSteps: [{ index: 8, label: "Recovery action executed" }]
    },
    {
      title: "OUTCOME",
      icon: CheckCircle2,
      subSteps: [{ index: 9, label: "Outcome verified & audit logged" }]
    }
  ];

  const getStageStatus = (subSteps: { index: number; label: string }[]) => {
    const statuses = subSteps.map((s) => stepStatus[s.index]);
    if (statuses.includes("failed")) return "failed";
    if (statuses.includes("active")) return "active";
    if (statuses.every((s) => s === "completed")) return "completed";
    if (statuses.some((s) => s === "completed")) return "active";
    return "pending";
  };

  const getStageStyles = (status: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-emerald-950/20 border-emerald-800/80 shadow-md shadow-emerald-950/40",
          text: "text-brandGreen",
          badge: "bg-emerald-950/40 text-brandGreen border-emerald-800/60",
          icon: <CheckCircle2 className="w-4.5 h-4.5 text-brandGreen" />
        };
      case "active":
        return {
          bg: "bg-brandBlue/10 border-brandBlue ring-2 ring-brandBlue/30 animate-pulse shadow-lg shadow-brandBlue/20",
          text: "text-brandBlue font-bold",
          badge: "bg-brandBlue/20 text-brandBlue border-brandBlue/40",
          icon: <Loader className="w-4.5 h-4.5 text-brandBlue animate-spin" />
        };
      case "failed":
        return {
          bg: "bg-rose-950/30 border-rose-900 shadow-md shadow-rose-950/40",
          text: "text-brandRed",
          badge: "bg-rose-950/50 text-brandRed border-rose-900/60",
          icon: <XCircle className="w-4.5 h-4.5 text-brandRed" />
        };
      case "pending":
      default:
        return {
          bg: "bg-bgCard/50 border-borderDark/60",
          text: "text-textMuted",
          badge: "bg-zinc-900 text-zinc-600 border-zinc-800",
          icon: <Lock className="w-4 h-4 text-zinc-700" />
        };
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 6 Stage Vertical Connected Pipeline */}
      <div className="relative pl-8 space-y-4">
        {/* Connected pipeline vertical line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-borderDark pointer-events-none"></div>

        {stages.map((stage, idx) => {
          const status = getStageStatus(stage.subSteps);
          const styles = getStageStyles(status);
          const isExpanded = expandedStage === idx;
          const StageIcon = stage.icon;

          return (
            <div key={idx} className="relative group">
              
              {/* Timeline Connector overlay */}
              {(status === "completed" || status === "active") && (
                <div
                  className="absolute left-[-25px] top-4 w-0.5 bg-brandBlue z-10 transition-all duration-500"
                  style={{ height: idx === stages.length - 1 ? "0%" : "125%" }}
                ></div>
              )}

              {/* Node Bullet */}
              <div className={`absolute left-[-29px] top-3.5 w-3 h-3 rounded-full z-20 transition-all border ${
                status === "completed" ? "bg-brandGreen border-brandGreen shadow-md shadow-brandGreen/40" :
                status === "active" ? "bg-brandBlue border-brandBlue shadow-md shadow-brandBlue/40 animate-ping" :
                status === "failed" ? "bg-brandRed border-brandRed" :
                "bg-bgDark border-borderDark"
              }`}></div>

              {/* Stage Card */}
              <div className={`border rounded-xl transition-all duration-300 ${styles.bg}`}>
                <div
                  onClick={() => setExpandedStage(isExpanded ? null : idx)}
                  className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3.5">
                    <StageIcon className="w-4.5 h-4.5 text-brandBlue" />
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${styles.text}`}>
                        STAGE 0{idx + 1} — {stage.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${styles.badge}`}>
                      {status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-textMuted" /> : <ChevronDown className="w-4 h-4 text-textMuted" />}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-2 border-t border-zinc-900/80 bg-zinc-950/60 rounded-b-xl space-y-3 text-xs animate-fadeIn">
                    <div className="space-y-1.5 pt-1">
                      {stage.subSteps.map((sub, sIdx) => {
                        const subStatus = stepStatus[sub.index];
                        return (
                          <div key={sIdx} className="flex justify-between items-center text-[11px]">
                            <span className={`${
                              subStatus === "completed" ? "text-textLight font-medium" :
                              subStatus === "active" ? "text-brandBlue font-bold" :
                              subStatus === "failed" ? "text-brandRed font-semibold" : "text-zinc-500"
                            }`}>
                              • {sub.label}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                              subStatus === "completed" ? "text-brandGreen" :
                              subStatus === "active" ? "text-brandBlue" :
                              subStatus === "failed" ? "text-brandRed" : "text-zinc-700"
                            }`}>
                              {subStatus}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Contextual payload displays */}
                    {idx === 1 && analysis && (
                      <div className="pt-3 border-t border-zinc-900 grid grid-cols-2 gap-3 text-[10px] bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                        <div>
                          <span className="text-textMuted">AI Recovery Probability:</span>
                          <span className="block font-bold text-brandGreen font-mono text-xs">{(analysis.recovery_probability * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-textMuted">Behavioral Confidence:</span>
                          <span className="block font-bold text-brandBlue font-mono text-xs">{(analysis.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}

                    {idx === 2 && analysis && (
                      <div className="pt-3 border-t border-zinc-900 grid grid-cols-3 gap-3 text-[10px] bg-zinc-950 p-3 rounded-lg border border-zinc-900">
                        <div>
                          <span className="text-textMuted">Est. Recovery Value:</span>
                          <span className="block font-bold text-white font-mono text-xs">₹{analysis.expected_recovery_value.toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-textMuted">Priority Index:</span>
                          <span className="block font-bold text-brandYellow font-mono text-xs">{analysis.priority_score.toFixed(0)} / 100</span>
                        </div>
                        <div>
                          <span className="text-textMuted font-medium">Selected Strategy:</span>
                          <span className="block font-bold text-brandBlue font-mono text-xs uppercase">{analysis.recommended_action.replace("_", " ")}</span>
                        </div>
                      </div>
                    )}

                    {idx === 3 && policyCheck && (
                      <div className="pt-3 border-t border-zinc-900 text-[10px] bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-1.5 font-mono">
                        <div className="flex justify-between">
                          <span className="text-textMuted">Max Retries Rule:</span>
                          <span className="font-bold text-brandGreen">PASS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textMuted">Min Confidence Rule:</span>
                          <span className="font-bold text-brandGreen">PASS</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-900 pt-1.5 font-bold">
                          <span className="text-white">Guardrail Audit Outcome:</span>
                          <span className={policyCheck.is_approved ? "text-brandGreen" : "text-brandRed"}>
                            {policyCheck.is_approved ? "APPROVED" : `BLOCKED (${policyCheck.block_reason})`}
                          </span>
                        </div>
                      </div>
                    )}

                    {idx === 5 && outcome && (
                      <div className="pt-3 border-t border-zinc-900 text-[10px] bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-1.5">
                        <div className="flex justify-between font-mono">
                          <span className={`font-bold uppercase ${
                            outcome.status === 'recovered' ? 'text-brandGreen' :
                            outcome.status === 'blocked_by_policy' ? 'text-brandYellow' :
                            outcome.status === 'escalated_to_human' ? 'text-brandBlue' : 'text-rose-400'
                          }`}>{outcome.status.replace("_", " ")}</span>
                        </div>
                        <p className="text-[10px] text-textMuted leading-relaxed pt-1 border-t border-zinc-900 font-mono">
                          {outcome.steps[outcome.steps.length - 1]?.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
