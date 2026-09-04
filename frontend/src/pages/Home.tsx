import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  RefreshCcw,
  Sparkles
} from "lucide-react";

interface HomeProps {
  onEnterApp: () => void;
}

export default function Home({ onEnterApp }: HomeProps) {
  const [scrollPct, setScrollPct] = useState<number>(0);
  const [activeStage, setActiveStage] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position continuously for smooth scroll-driven interpolation (0.0 to 1.0)
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      const currentScrolled = -rect.top;

      if (totalScrollable <= 0) return;
      const pct = Math.max(0, Math.min(1, currentScrolled / totalScrollable));
      setScrollPct(pct);

      // Compute discrete active stage (0 to 5) for text focus
      const stageIndex = Math.min(5, Math.floor(pct * 6));
      setActiveStage(stageIndex);
    };

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const stagesList = [
    { id: 0, tag: "01", title: "HEALTHY FLOW" },
    { id: 1, tag: "02", title: "LEAKAGE" },
    { id: 2, tag: "03", title: "AI DETECTION" },
    { id: 3, tag: "04", title: "DECISION" },
    { id: 4, tag: "05", tagTitle: "VALIDATION", title: "GUARDRAILS" },
    { id: 5, tag: "06", title: "RECOVERY" },
  ];

  // Helper to compute continuous opacity for section cards based on scroll pct
  const getSectionOpacity = (stageIdx: number) => {
    const targetPct = stageIdx / 5;
    const distance = Math.abs(scrollPct - targetPct);
    return Math.max(0.15, 1 - distance * 4.5);
  };

  const getSectionTransform = (stageIdx: number) => {
    const targetPct = stageIdx / 5;
    const diff = scrollPct - targetPct;
    const translateY = diff * 80;
    return `translateY(${translateY}px)`;
  };

  return (
    <div ref={containerRef} className="relative bg-bgDark min-h-[500vh] text-textLight font-sans selection:bg-brandBlue/30 selection:text-white">
      {/* Sticky Top Header Bar */}
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-borderDark/80 bg-bgDark/90 backdrop-blur-md z-40 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-brandBlue flex items-center justify-center font-black text-white shadow-md shadow-brandBlue/20">
            R
          </div>
          <div>
            <span className="text-sm font-black tracking-tight uppercase text-white">REVENUELEAK AI</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onEnterApp}
            className="bg-brandBlue hover:bg-brandBlueHover text-white px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 shadow-md shadow-brandBlue/20 flex items-center space-x-2"
          >
            <span>Enter Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Right Column: Sticky Scroll-Responsive Visual System */}
      <div className="sticky top-16 right-0 h-[calc(100vh-4rem)] w-full lg:w-[52%] float-right flex items-center justify-center p-4 sm:p-6 lg:p-10 z-20 overflow-hidden">
        <div className="w-full max-w-xl bg-bgCard/95 border border-borderDark rounded-xl p-6 lg:p-8 relative shadow-2xl backdrop-blur-xl flex flex-col justify-between h-[520px]">
          
          {/* Header indicator */}
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-brandBlue uppercase tracking-wider">
              <Activity className="w-4 h-4 text-brandBlue" />
              <span>Revenue Intelligence Flow Engine</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-textMuted font-mono font-bold">STAGE 0{activeStage + 1} / 06</span>
            </div>
          </div>

          {/* Canvas: Dynamically rendered based on exact scroll percentage */}
          <div className="relative flex-1 flex items-center justify-center my-2">
            <svg className="w-full h-full max-h-[340px]" viewBox="0 0 540 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="healthy-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="leak-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="recovery-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Base Line */}
              <line x1="40" y1="170" x2="500" y2="170" stroke="#1F2328" strokeWidth="2" strokeDasharray="4 4" />
              
              {/* STATE 0: Healthy Flow */}
              <path
                d="M 40 170 Q 180 170, 270 170 T 500 170"
                stroke={activeStage >= 5 ? "#10B981" : "url(#healthy-grad)"}
                strokeWidth={activeStage === 0 ? "5" : "3.5"}
                fill="none"
                style={{ transition: "stroke 0.4s ease, stroke-width 0.4s ease" }}
              />

              {/* Main Stream Intake Node */}
              <circle cx="40" cy="170" r="12" fill="#0B0C0E" stroke="#2563EB" strokeWidth="3" />
              <circle cx="40" cy="170" r="5" fill="#2563EB" />
              <text x="40" y="198" fill="#8A94A6" fontSize="9" textAnchor="middle" fontWeight="bold font-mono">GROSS INTAKE</text>

              {/* STATE 1: Leakage Branch (Reveals smoothly when scrollPct >= 0.16) */}
              <g style={{ opacity: Math.min(1, Math.max(0, (scrollPct - 0.12) * 6)), transition: "opacity 0.3s ease" }}>
                <path
                  d="M 180 170 Q 230 170, 270 240 T 360 260"
                  stroke="url(#leak-grad)"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle cx="360" cy="260" r="16" fill="#0B0C0E" stroke="#EF4444" strokeWidth="2.5" />
                <circle cx="360" cy="260" r="6" fill="#EF4444" />
                <rect x="300" y="290" width="120" height="24" rx="4" fill="#180C0E" stroke="#EF4444" strokeWidth="1" />
                <text x="360" y="306" fill="#EF4444" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                  ₹45,000 LEAKED
                </text>
              </g>

              {/* STATE 2: AI Detection Scanner (Reveals smoothly when scrollPct >= 0.32) */}
              <g style={{ opacity: Math.min(1, Math.max(0, (scrollPct - 0.30) * 6)), transition: "opacity 0.3s ease" }}>
                <circle cx="360" cy="260" r="34" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 6" />
                <line x1="270" y1="70" x2="360" y2="260" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle cx="270" cy="70" r="14" fill="#0B0C0E" stroke="#F59E0B" strokeWidth="3" />
                <circle cx="270" cy="70" r="5" fill="#F59E0B" />
                <text x="270" y="48" fill="#F59E0B" fontSize="10" textAnchor="middle" fontWeight="bold">AI SCORER</text>

                <g transform="translate(60, 40)">
                  <rect x="0" y="0" width="160" height="82" rx="6" fill="#131518" stroke="#1F2328" strokeWidth="1.5" />
                  <text x="12" y="20" fill="#8A94A6" fontSize="8" fontWeight="bold">TELEMETRY SCORES</text>
                  <text x="12" y="38" fill="#F3F4F6" fontSize="10" fontWeight="bold">At Risk: ₹45,000</text>
                  <text x="12" y="54" fill="#10B981" fontSize="10" fontWeight="bold">Recoverability: 87%</text>
                  <text x="12" y="70" fill="#F59E0B" fontSize="10" fontWeight="bold">Priority Score: 94 / 100</text>
                </g>
              </g>

              {/* STATE 3: Decision Orchestrator (Reveals when scrollPct >= 0.50) */}
              <g style={{ opacity: Math.min(1, Math.max(0, (scrollPct - 0.48) * 6)), transition: "opacity 0.3s ease" }}>
                <rect x="230" y="140" width="80" height="60" rx="6" fill="#0B0C0E" stroke="#3B82F6" strokeWidth="2" />
                <text x="270" y="163" fill="#60A5FA" fontSize="9" textAnchor="middle" fontWeight="bold">ORCHESTRATOR</text>
                <text x="270" y="180" fill="#10B981" fontSize="8" textAnchor="middle" fontWeight="semibold">RETRY_DELAY</text>
              </g>

              {/* STATE 4: Policy Guardrails (Reveals when scrollPct >= 0.68) */}
              <g style={{ opacity: Math.min(1, Math.max(0, (scrollPct - 0.65) * 6)), transition: "opacity 0.3s ease" }}>
                <rect x="350" y="125" width="130" height="90" rx="6" fill="#0B0C0E" stroke="#10B981" strokeWidth="1.5" />
                <text x="415" y="145" fill="#10B981" fontSize="9" textAnchor="middle" fontWeight="bold">MERCHANT GUARDRAILS</text>
                <text x="362" y="165" fill="#8A94A6" fontSize="8">Max Retries: 1/2</text>
                <text x="455" y="165" fill="#10B981" fontSize="8" fontWeight="bold">✓ PASS</text>
                <text x="362" y="180" fill="#8A94A6" fontSize="8">Min Conf: 91%/70%</text>
                <text x="455" y="180" fill="#10B981" fontSize="8" fontWeight="bold">✓ PASS</text>
                <text x="362" y="195" fill="#8A94A6" fontSize="8">High Value Limit</text>
                <text x="455" y="195" fill="#10B981" fontSize="8" fontWeight="bold">✓ PASS</text>
              </g>

              {/* STATE 5: Recovery Reconnection (Reveals when scrollPct >= 0.84) */}
              <g style={{ opacity: Math.min(1, Math.max(0, (scrollPct - 0.82) * 6)), transition: "opacity 0.3s ease" }}>
                <path
                  d="M 360 260 Q 420 260, 460 200 T 500 170"
                  stroke="url(#recovery-grad)"
                  strokeWidth="4"
                  fill="none"
                />
                <circle cx="500" cy="170" r="14" fill="#0B0C0E" stroke="#10B981" strokeWidth="3" />
                <circle cx="500" cy="170" r="6" fill="#10B981" />
                <text x="500" y="198" fill="#10B981" fontSize="9" textAnchor="middle" fontWeight="bold font-mono">RECOVERED</text>
              </g>
            </svg>
          </div>

          {/* Connected Stage Indicators */}
          <div className="grid grid-cols-6 gap-1.5 pt-3 border-t border-zinc-900">
            {stagesList.map((stg) => {
              const isActive = activeStage === stg.id;
              const isPassed = activeStage > stg.id;
              return (
                <div
                  key={stg.id}
                  className={`py-2 px-1 text-center rounded transition-all duration-300 ${
                    isActive
                      ? "bg-brandBlue text-white border border-brandBlue shadow-md shadow-brandBlue/30 font-bold"
                      : isPassed
                      ? "bg-emerald-950/30 text-brandGreen border border-emerald-800/40 font-semibold"
                      : "bg-zinc-950 text-zinc-600 border border-transparent"
                  }`}
                >
                  <p className="text-[8px] font-mono uppercase">STATE {stg.tag}</p>
                  <p className="text-[9px] truncate">{stg.title}</p>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Left Column: Scroll-interpolated Storytelling Sections */}
      <div className="w-full lg:w-[48%] px-6 sm:px-12 lg:px-20 flex flex-col justify-start relative z-30 pt-16">
        
        {/* STATE 01 — HEALTHY FLOW */}
        <section
          style={{ opacity: getSectionOpacity(0), transform: getSectionTransform(0) }}
          className="h-[80vh] flex flex-col justify-center max-w-lg space-y-6 transition-all duration-300"
        >
          <div className="inline-flex items-center space-x-2 bg-brandBlue/10 border border-brandBlue/30 px-3 py-1 rounded-full text-xs font-bold text-brandBlue uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-brandBlue" />
            <span>State 01 / Baseline Stream</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight">
            Revenue isn't just lost. <br />
            <span className="text-brandRed">It leaks silently.</span>
          </h1>

          <p className="text-sm lg:text-base text-textMuted leading-relaxed">
            Every digital operation experiences payment drop-offs. RevenueLeak AI identifies where money gets stuck, scores recoverability using machine learning, and safely automates recovery workflows.
          </p>

          <div className="pt-4 flex items-center space-x-4">
            <button
              onClick={onEnterApp}
              className="bg-brandBlue hover:bg-brandBlueHover text-white px-7 py-3.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 shadow-lg shadow-brandBlue/20 flex items-center space-x-2"
            >
              <span>Enter Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* STATE 02 — LEAKAGE */}
        <section
          style={{ opacity: getSectionOpacity(1), transform: getSectionTransform(1) }}
          className="h-[80vh] flex flex-col justify-center max-w-lg space-y-6 transition-all duration-300"
        >
          <div className="inline-flex items-center space-x-2 bg-rose-950/40 border border-rose-900/60 px-3 py-1 rounded-full text-xs font-bold text-brandRed uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5 text-brandRed" />
            <span>State 02 / Friction Points</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">The Silent Leaks</h2>
          <p className="text-sm lg:text-base text-textMuted leading-relaxed">
            Bank downtimes, expired mandates, payment gateway timeouts, and abandoned checkouts quietly siphon away up to 15% of ARR without real-time detection.
          </p>

          <div className="bg-zinc-950 p-5 border border-zinc-900 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2 text-xs">
              <span className="text-textMuted">Failed Card Retries</span>
              <span className="font-bold text-brandRed font-mono">₹35,000 at risk</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2 text-xs">
              <span className="text-textMuted">Checkout Abandonments</span>
              <span className="font-bold text-brandRed font-mono">₹28,000 at risk</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-textMuted">Subscription Mandate Failures</span>
              <span className="font-bold text-brandRed font-mono">₹32,000 at risk</span>
            </div>
          </div>
        </section>

        {/* STATE 03 — AI DETECTION */}
        <section
          style={{ opacity: getSectionOpacity(2), transform: getSectionTransform(2) }}
          className="h-[80vh] flex flex-col justify-center max-w-lg space-y-6 transition-all duration-300"
        >
          <div className="inline-flex items-center space-x-2 bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded-full text-xs font-bold text-brandYellow uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-brandYellow" />
            <span>State 03 / Predictive Scoring</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Trained ML Intelligence</h2>
          <p className="text-sm lg:text-base text-textMuted leading-relaxed">
            Our custom Random Forest model analyzes payment method success rates, customer transaction history, and retry counts to calculate expected recovery values instantly.
          </p>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-bgCard border border-borderDark p-4 rounded-xl">
              <p className="text-[10px] text-textMuted uppercase font-bold tracking-wider font-mono">Recoverability</p>
              <h4 className="text-3xl font-black text-brandGreen mt-1 font-mono">87%</h4>
            </div>
            <div className="bg-bgCard border border-borderDark p-4 rounded-xl">
              <p className="text-[10px] text-textMuted uppercase font-bold tracking-wider font-mono">Priority Index</p>
              <h4 className="text-3xl font-black text-brandYellow mt-1 font-mono">94 / 100</h4>
            </div>
          </div>
        </section>

        {/* STATE 04 — DECISION */}
        <section
          style={{ opacity: getSectionOpacity(3), transform: getSectionTransform(3) }}
          className="h-[80vh] flex flex-col justify-center max-w-lg space-y-6 transition-all duration-300"
        >
          <div className="inline-flex items-center space-x-2 bg-brandBlue/10 border border-brandBlue/30 px-3 py-1 rounded-full text-xs font-bold text-brandBlue uppercase tracking-widest">
            <RefreshCcw className="w-3.5 h-3.5 text-brandBlue" />
            <span>State 04 / Strategy Selection</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Adaptive Strategy Selection</h2>
          <p className="text-sm lg:text-base text-textMuted leading-relaxed">
            The orchestrator selects the exact optimal strategy—whether scheduling delayed retries, sending personalized payment links, or escalating high-value cases to human support.
          </p>

          <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl text-xs space-y-2 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-textMuted">Network Timeout</span>
              <span className="font-bold text-brandBlue">RETRY_IMMEDIATELY</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textMuted">Overdue Invoice</span>
              <span className="font-bold text-brandYellow">HUMAN_ESCALATION</span>
            </div>
          </div>
        </section>

        {/* STATE 05 — POLICY VALIDATION */}
        <section
          style={{ opacity: getSectionOpacity(4), transform: getSectionTransform(4) }}
          className="h-[80vh] flex flex-col justify-center max-w-lg space-y-6 transition-all duration-300"
        >
          <div className="inline-flex items-center space-x-2 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-full text-xs font-bold text-brandGreen uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5 text-brandGreen" />
            <span>State 05 / Guardrail Layer</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Trust & Guardrail Protection</h2>
          <p className="text-sm lg:text-base text-textMuted leading-relaxed">
            AI proposes, but merchant rules govern. Every action must validate against retry limits, confidence floors, and high-value approval thresholds before executing.
          </p>

          <div className="flex items-center space-x-3 text-xs bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            <Lock className="w-5 h-5 text-brandGreen flex-shrink-0" />
            <span className="text-textMuted leading-relaxed">
              Automatic validation prevents customer spam, guarantees policy compliance, and keeps brand trust 100% secure.
            </span>
          </div>
        </section>

        {/* STATE 06 — RECOVERY */}
        <section
          style={{ opacity: getSectionOpacity(5), transform: getSectionTransform(5) }}
          className="h-[80vh] flex flex-col justify-center max-w-lg space-y-6 transition-all duration-300 pb-20"
        >
          <div className="inline-flex items-center space-x-2 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-full text-xs font-bold text-brandGreen uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5 text-brandGreen" />
            <span>State 06 / Autonomous Recovery</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-black tracking-tight">Recover what matters.</h2>
          <p className="text-sm lg:text-base text-textMuted leading-relaxed">
            Leaked revenue re-enters your gross ledger safely. Launch the Revenue Intelligence Command Center now.
          </p>

          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto bg-brandBlue hover:bg-brandBlueHover text-white px-8 py-4 rounded-lg font-bold text-xs tracking-wider transition-all duration-200 uppercase flex items-center justify-center space-x-2 shadow-xl shadow-brandBlue/30"
          >
            <span>ENTER REVENUELEAK AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>

      </div>
    </div>
  );
}
