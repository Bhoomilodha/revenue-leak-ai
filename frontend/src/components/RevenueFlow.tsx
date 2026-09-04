import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface RevenueFlowProps {
  atRisk: number;
  recovered: number;
  opportunity: number;
}

export default function RevenueFlow({ atRisk, recovered, opportunity }: RevenueFlowProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animateKey, setAnimateKey] = useState<number>(0);

  const total = atRisk + recovered;
  const unrecoverable = Math.max(0, atRisk - opportunity);

  // Re-trigger single-run flow animation whenever data updates
  useEffect(() => {
    setAnimateKey((prev) => prev + 1);
  }, [atRisk, recovered, opportunity]);

  // Compute percentages for stroke widths and labels
  const recPercent = total > 0 ? (recovered / total) * 100 : 0;
  const riskPercent = total > 0 ? (atRisk / total) * 100 : 0;
  const oppPercent = atRisk > 0 ? (opportunity / atRisk) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full bg-bgCard border border-borderDark/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-zinc-900 pb-3 gap-2">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brandBlue" />
            <span>Executive Revenue Pipeline Sankey Flow</span>
          </h3>
          <p className="text-[11px] text-textMuted mt-0.5">Live Cash Intake → Recovered Net vs At-Risk Sinks → AI Scored Opportunities</p>
        </div>

        <div className="flex items-center space-x-3 text-[10px] font-mono font-bold">
          <span className="flex items-center space-x-1.5 text-brandGreen">
            <span className="w-2 h-2 rounded-full bg-brandGreen"></span>
            <span>Recovered ({recPercent.toFixed(0)}%)</span>
          </span>
          <span className="flex items-center space-x-1.5 text-brandRed">
            <span className="w-2 h-2 rounded-full bg-brandRed"></span>
            <span>At Risk ({riskPercent.toFixed(0)}%)</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas with absolute non-overlapping label layout */}
      <div className="relative w-full aspect-[880/300] max-h-[320px] select-none">
        <svg className="w-full h-full" viewBox="0 0 880 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flow-recovered-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="flow-at-risk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="flow-opp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="flow-unrec-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#374151" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* CONNECTING BEZIER PATHS */}
          {/* Path 1: Intake -> Recovered */}
          <path
            d="M 140 150 C 270 150, 290 75, 450 75"
            stroke="url(#flow-recovered-grad)"
            strokeWidth={Math.max(4, (recPercent / 100) * 36)}
            fill="none"
            className={`transition-all duration-300 ${hoveredNode === 'recovered' ? 'stroke-[10] opacity-100' : 'opacity-70'}`}
          />
          <path
            key={`p1-${animateKey}`}
            d="M 140 150 C 270 150, 290 75, 450 75"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="12 24"
            className="flow-animate-once"
            fill="none"
          />

          {/* Path 2: Intake -> At Risk */}
          <path
            d="M 140 150 C 270 150, 290 225, 450 225"
            stroke="url(#flow-at-risk-grad)"
            strokeWidth={Math.max(4, (riskPercent / 100) * 36)}
            fill="none"
            className={`transition-all duration-300 ${hoveredNode === 'atRisk' ? 'stroke-[10] opacity-100' : 'opacity-70'}`}
          />
          <path
            key={`p2-${animateKey}`}
            d="M 140 150 C 270 150, 290 225, 450 225"
            stroke="#EF4444"
            strokeWidth="2"
            strokeDasharray="12 24"
            className="flow-animate-once"
            fill="none"
          />

          {/* Path 3: At Risk -> AI Opportunity */}
          <path
            d="M 450 225 C 570 225, 600 130, 710 130"
            stroke="url(#flow-opp-grad)"
            strokeWidth={Math.max(3, (oppPercent / 100) * 28)}
            fill="none"
            className={`transition-all duration-300 ${hoveredNode === 'opportunity' ? 'stroke-[8] opacity-100' : 'opacity-70'}`}
          />
          <path
            key={`p3-${animateKey}`}
            d="M 450 225 C 570 225, 600 130, 710 130"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="10 20"
            className="flow-animate-once"
            fill="none"
          />

          {/* Path 4: At Risk -> Unrecoverable */}
          <path
            d="M 450 225 C 570 225, 600 235, 710 235"
            stroke="url(#flow-unrec-grad)"
            strokeWidth="3"
            fill="none"
            className="transition-all duration-300 opacity-50"
          />

          {/* NODE CIRCLE INDICATORS */}
          {/* Node 1: Intake */}
          <g onMouseEnter={() => setHoveredNode('total')} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
            <circle cx="140" cy="150" r="16" fill="#0B0C0E" stroke="#2563EB" strokeWidth="3" />
            <circle cx="140" cy="150" r="6" fill="#2563EB" />
          </g>

          {/* Node 2: Recovered */}
          <g onMouseEnter={() => setHoveredNode('recovered')} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
            <circle cx="450" cy="75" r="15" fill="#0B0C0E" stroke="#10B981" strokeWidth="3" />
            <circle cx="450" cy="75" r="5" fill="#10B981" />
          </g>

          {/* Node 3: At Risk */}
          <g onMouseEnter={() => setHoveredNode('atRisk')} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
            <circle cx="450" cy="225" r="15" fill="#0B0C0E" stroke="#EF4444" strokeWidth="3" />
            <circle cx="450" cy="225" r="5" fill="#EF4444" />
          </g>

          {/* Node 4: AI Opportunity */}
          <g onMouseEnter={() => setHoveredNode('opportunity')} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
            <circle cx="710" cy="130" r="13" fill="#0B0C0E" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="710" cy="130" r="4" fill="#F59E0B" />
          </g>

          {/* Node 5: Unrecoverable */}
          <g className="cursor-pointer">
            <circle cx="710" cy="235" r="11" fill="#0B0C0E" stroke="#4B5563" strokeWidth="2.5" />
            <circle cx="710" cy="235" r="3.5" fill="#4B5563" />
          </g>

          {/* PRECISE SVG TEXT LABELS — ZERO OVERLAP GUARANTEED */}
          {/* Label 1: Total Intake (Left side of node 1) */}
          <g transform="translate(10, 138)">
            <text fill="#2563EB" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.05em">TOTAL INTAKE</text>
            <text y="18" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="monospace">{formatCurrency(total)}</text>
          </g>

          {/* Label 2: Recovered Net (Directly ABOVE Node 2, centered at x=450, y=18 to y=45) */}
          <g transform="translate(450, 20)">
            <text fill="#10B981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.05em">RECOVERED NET</text>
            <text y="16" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">{formatCurrency(recovered)}</text>
            <text y="30" fill="#10B981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">({recPercent.toFixed(0)}% of total)</text>
          </g>

          {/* Label 3: At Risk Sink (Directly BELOW Node 3, centered at x=450, y=252 to y=285) */}
          <g transform="translate(450, 254)">
            <text fill="#EF4444" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.05em">AT RISK SINK</text>
            <text y="16" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">{formatCurrency(atRisk)}</text>
            <text y="30" fill="#EF4444" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">({riskPercent.toFixed(0)}% of total)</text>
          </g>

          {/* Label 4: AI Opportunity (To the RIGHT of Node 4, x=735, y=115 to y=145) */}
          <g transform="translate(734, 115)">
            <text fill="#F59E0B" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.05em">AI OPPORTUNITY</text>
            <text y="16" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="monospace">{formatCurrency(opportunity)}</text>
            <text y="30" fill="#F59E0B" fontSize="10" fontWeight="bold" fontFamily="monospace">({oppPercent.toFixed(0)}% target)</text>
          </g>

          {/* Label 5: Unrecoverable (To the RIGHT of Node 5, x=735, y=228 to y=248) */}
          <g transform="translate(734, 228)">
            <text fill="#8A94A6" fontSize="10" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.05em">UNRECOVERABLE</text>
            <text y="16" fill="#9CA3AF" fontSize="12" fontWeight="700" fontFamily="monospace">{formatCurrency(unrecoverable)}</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
