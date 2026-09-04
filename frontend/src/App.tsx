import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PageTransition from "./components/PageTransition";

export default function App() {
  const [viewState, setViewState] = useState<"home" | "login" | "dashboard">("home");

  // Load auth state from localStorage on boot
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token === "demo-token-active-42") {
      setViewState("dashboard");
    } else {
      setViewState("home");
    }
  }, []);

  const handleEnterApp = () => {
    // Check if token exists, go directly to dashboard, else login
    const token = localStorage.getItem("authToken");
    if (token === "demo-token-active-42") {
      setViewState("dashboard");
    } else {
      setViewState("login");
    }
  };

  const handleLoginSuccess = () => {
    setViewState("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setViewState("home");
  };

  return (
    <div className="min-h-screen bg-bgDark text-textLight selection:bg-brandBlue/30 selection:text-textLight">
      {viewState === "home" && (
        <PageTransition trigger={viewState} direction="fade">
          <Home onEnterApp={handleEnterApp} />
        </PageTransition>
      )}

      {viewState === "login" && (
        <PageTransition trigger={viewState} direction="slide-left">
          <Login onLoginSuccess={handleLoginSuccess} />
        </PageTransition>
      )}

      {viewState === "dashboard" && (
        <PageTransition trigger={viewState} direction="slide-up">
          <Dashboard onLogout={handleLogout} />
        </PageTransition>
      )}
    </div>
  );
}
