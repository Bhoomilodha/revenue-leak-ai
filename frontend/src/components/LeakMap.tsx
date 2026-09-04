interface LeakCategoryData {
  name: string;
  amount_at_risk: number;
  recoverability: number;
  priority_score: number;
  expected_recovery_value: number;
  affected_cases: number;
}

interface LeakMapProps {
  data: Record<string, LeakCategoryData>;
  onSelectNode: (leakType: string) => void;
  selectedNode: string | null;
}

export default function LeakMap({ data, onSelectNode, selectedNode }: LeakMapProps) {
  const categories = [
    { key: "checkout_abandonment", stage: "01", label: "CHECKOUT", color: "border-brandBlue text-brandBlue" },
    { key: "payment_failure", stage: "02", label: "PAYMENT PROCESSING", color: "border-brandRed text-brandRed" },
    { key: "failed_subscription", stage: "03", label: "SUBSCRIPTIONS", color: "border-brandYellow text-brandYellow" },
    { key: "overdue_invoice", stage: "04", label: "RECEIVABLES", color: "border-zinc-500 text-zinc-400" }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full space-y-6">
      {/* Visual Pipeline Container */}
      <div className="bg-bgCard border border-borderDark/80 rounded-xl p-6 lg:p-8 relative overflow-hidden shadow-2xl">
        
        {/* Animated Connecting SVG Wire Path */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <svg className="w-full h-full" viewBox="0 0 1000 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background line */}
            <line x1="120" y1="120" x2="880" y2="120" stroke="#1F2328" strokeWidth="4" />
            
            {/* Animated Stream Particles */}
            <line
              x1="120"
              y1="120"
              x2="880"
              y2="120"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeDasharray="15 50"
              className="flow-animate-once"
            />
          </svg>
        </div>

        {/* 4 Connected Pipeline Stages */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          {categories.map(({ key, stage, label }) => {
            const cat = data[key];
            if (!cat) return null;

            const isSelected = selectedNode === key;
            const priorityLevel = cat.priority_score > 80 ? "HIGH" : cat.priority_score > 60 ? "MEDIUM" : "LOW";

            return (
              <div
                key={key}
                onClick={() => onSelectNode(key)}
                className={`bg-bgDark border rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative ${
                  isSelected
                    ? "border-brandBlue ring-2 ring-brandBlue/40 bg-bgCard/90 shadow-[0_0_25px_rgba(37,99,235,0.25)] opacity-100 scale-[1.02]"
                    : selectedNode
                    ? "border-borderDark/60 opacity-60 hover:opacity-90 hover:border-zinc-700"
                    : "border-borderDark hover:border-zinc-700 opacity-100"
                }`}
              >
                {/* Stage Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono font-bold text-brandBlue uppercase tracking-wider">STAGE {stage}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider ${
                    priorityLevel === "HIGH" ? "bg-rose-950/40 text-brandRed border border-rose-900/50" :
                    priorityLevel === "MEDIUM" ? "bg-amber-950/40 text-brandYellow border border-amber-800/50" :
                    "bg-zinc-900 text-zinc-400 border border-zinc-800"
                  }`}>
                    {priorityLevel} ({cat.priority_score.toFixed(0)})
                  </span>
                </div>

                {/* Node Title */}
                <h4 className="text-sm font-extrabold text-white tracking-tight uppercase mb-4">{cat.name || label}</h4>

                {/* Risk Amount */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase text-textMuted font-semibold">Revenue At Risk</p>
                  <h5 className="text-2xl font-black font-mono tracking-tight text-white">{formatCurrency(cat.amount_at_risk)}</h5>
                </div>

                {/* Sub metrics grid */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-zinc-900 text-[10px]">
                  <div>
                    <span className="block font-mono font-bold text-brandGreen">{cat.recoverability.toFixed(0)}%</span>
                    <span className="text-textMuted">Recoverability</span>
                  </div>
                  <div>
                    <span className="block font-mono font-bold text-white">{cat.affected_cases}</span>
                    <span className="text-textMuted">Cases Affected</span>
                  </div>
                </div>

                {/* Potential Recovery Indicator */}
                <div className="mt-4 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 flex items-center justify-between text-[10px]">
                  <span className="text-textMuted uppercase font-mono">Potential</span>
                  <span className="font-bold font-mono text-brandGreen">{formatCurrency(cat.expected_recovery_value)}</span>
                </div>

                {/* Selected Indicator Arrow */}
                {isSelected && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-brandBlue rotate-45 rounded-sm"></div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
