import { useState } from "react";
import { Shield, ArrowRight, Activity, Zap } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setTimeout(() => {
      if (email === "admin@revenueleak.ai" && password === "admin123") {
        localStorage.setItem("authToken", "demo-token-active-42");
        onLoginSuccess();
      } else {
        setError("Invalid credentials. Hint: use the 'Bypass & Demo Access' button.");
        setLoading(false);
      }
    }, 600);
  };

  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem("authToken", "demo-token-active-42");
      onLoginSuccess();
    }, 350);
  };

  return (
    <div className="min-h-screen bg-bgDark flex flex-col md:flex-row items-stretch select-none font-sans text-textLight">
      {/* Left Column: Authentic B2B Fintech Login Form */}
      <div className="w-full md:w-[46%] border-r border-borderDark bg-bgCard/40 flex flex-col justify-between p-8 lg:p-14 z-20">
        {/* Branding header */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-brandBlue flex items-center justify-center font-black text-xl text-white shadow-lg shadow-brandBlue/30">
            R
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase text-white">REVENUELEAK AI</h1>
            <p className="text-[10px] text-textMuted uppercase font-mono tracking-wider">Revenue Intelligence Engine</p>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="max-w-sm w-full mx-auto space-y-6 py-10">
          <div className="space-y-2">
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">Command Center</h2>
            <p className="text-xs text-textMuted leading-relaxed">
              Sign in to monitor real-time leakage funnels, configure merchant safety guardrails, and execute AI recovery actions.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            {error && (
              <div className="bg-rose-950/40 text-brandRed border border-rose-900/60 p-3 rounded-lg text-xs font-semibold animate-fadeIn">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Merchant Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@revenueleak.ai"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-3 text-xs text-textLight focus:outline-none focus:ring-1 focus:ring-brandBlue focus:border-brandBlue transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-3 text-xs text-textLight focus:outline-none focus:ring-1 focus:ring-brandBlue focus:border-brandBlue transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brandBlue hover:bg-brandBlueHover text-white font-bold text-xs tracking-wider transition-all duration-200 rounded-lg uppercase flex items-center justify-center space-x-2 shadow-lg shadow-brandBlue/20"
            >
              <span>{loading ? "Authenticating Session..." : "Sign In to Platform"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Instant Demo Access</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button
            onClick={handleDemoAccess}
            disabled={loading}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-brandBlue hover:text-white border border-zinc-800 hover:border-brandBlue/50 rounded-lg font-bold text-xs tracking-wider transition-all uppercase flex items-center justify-center space-x-2"
          >
            <Zap className="w-3.5 h-3.5 text-brandBlue" />
            <span>Bypass & Demo Access</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono">
          <Shield className="w-3.5 h-3.5 text-brandBlue" />
          <span>Local Developer Sandbox Environment • SQLite 3 & FastAPI</span>
        </div>
      </div>

      {/* Right Column: Connected Revenue Intelligence Visualization */}
      <div className="hidden md:flex flex-1 items-center justify-center p-12 bg-bgDark relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#131518_1px,transparent_1px),linear-gradient(to_bottom,#131518_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-60"></div>

        <div className="relative z-10 w-full max-w-lg bg-bgCard/90 border border-borderDark/80 rounded-xl p-8 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-zinc-900/80 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brandBlue animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-textLight">Live Revenue Telemetry</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/40 text-brandGreen border border-emerald-800/40">
              ORCHESTRATOR ONLINE
            </span>
          </div>

          {/* SVG Animated Flow Canvas */}
          <svg className="w-full h-64" viewBox="0 0 440 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="login-flow-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Connecting paths */}
            <path d="M 60 120 C 140 120, 140 50, 220 50 C 300 50, 300 120, 380 120" stroke="#1F2328" strokeWidth="2.5" fill="none" />
            <path d="M 60 120 C 140 120, 140 190, 220 190 C 300 190, 300 120, 380 120" stroke="#1F2328" strokeWidth="2.5" fill="none" />

            {/* Animated Stream Lines */}
            <path d="M 60 120 C 140 120, 140 50, 220 50 C 300 50, 300 120, 380 120" stroke="url(#login-flow-1)" strokeWidth="2" strokeDasharray="10 30" className="flow-animate-once" fill="none" />
            <path d="M 60 120 C 140 120, 140 190, 220 190 C 300 190, 300 120, 380 120" stroke="#EF4444" strokeWidth="2" strokeDasharray="10 35" className="flow-animate-once" fill="none" />

            {/* Node Dots */}
            <circle cx="60" cy="120" r="10" fill="#0B0C0E" stroke="#2563EB" strokeWidth="2.5" />
            <circle cx="60" cy="120" r="4" fill="#2563EB" />

            <circle cx="220" cy="50" r="12" fill="#0B0C0E" stroke="#10B981" strokeWidth="2.5" />
            <circle cx="220" cy="50" r="5" fill="#10B981" />

            <circle cx="220" cy="190" r="12" fill="#0B0C0E" stroke="#EF4444" strokeWidth="2.5" />
            <circle cx="220" cy="190" r="5" fill="#EF4444" />

            <circle cx="380" cy="120" r="12" fill="#0B0C0E" stroke="#10B981" strokeWidth="3" />
            <circle cx="380" cy="120" r="5" fill="#10B981" />

            {/* Labels */}
            <text x="60" y="146" fill="#8A94A6" fontSize="9" textAnchor="middle" fontWeight="bold">INTAKE</text>
            <text x="220" y="32" fill="#10B981" fontSize="9" textAnchor="middle" fontWeight="bold">RECOVERED</text>
            <text x="220" y="218" fill="#EF4444" fontSize="9" textAnchor="middle" fontWeight="bold">LEAKAGE</text>
            <text x="380" y="146" fill="#10B981" fontSize="9" textAnchor="middle" fontWeight="bold">GROSS NET</text>
          </svg>

          {/* Model specs box */}
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-900 flex items-center justify-between text-xs">
            <div>
              <span className="block text-[10px] text-textMuted uppercase font-mono">Trained Model</span>
              <span className="font-bold text-textLight font-mono">RandomForest(max_depth=6)</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-textMuted uppercase font-mono">ROC-AUC Score</span>
              <span className="font-bold text-brandGreen font-mono">~76% Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
