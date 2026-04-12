import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import Landing from "./Landing";
import Dashboard from "./Dashboard";
import Offers from "./Offers";

/**
 * Main App Router Component
 * Routes between Landing (auth), Dashboard (applications), and Offers view
 * Handles session restoration from localStorage on app startup
 */
export default function App() {
  const { isAuthenticated, loading, login } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  // Show loading state while attempting to restore session from localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-slate/5 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 mb-4">
            <div className="w-10 h-10 border-4 border-slate/20 border-t-slate rounded-full animate-spin"></div>
          </div>
          <p className="text-slate font-medium">Restoring your session...</p>
        </div>
      </div>
    );
  }

  // Authenticated users see the dashboard or offers view
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-slate/5">
        <nav className="border-b border-slate/10 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-bold text-slate">JAT</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    currentView === "dashboard"
                      ? "bg-slate text-cream"
                      : "text-slate hover:bg-slate/10"
                  }`}
                >
                  Applications
                </button>
                <button
                  onClick={() => setCurrentView("offers")}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    currentView === "offers"
                      ? "bg-slate text-cream"
                      : "text-slate hover:bg-slate/10"
                  }`}
                >
                  Compare Offers
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === "dashboard" ? <Dashboard /> : <Offers />}
        </div>
      </div>
    );
  }

  // Unauthenticated users see the landing/auth page
  return <Landing onLogin={login} />;
}
