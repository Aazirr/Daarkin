import { useState } from "react";
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
      <div className="app-content">
        <div className="panel offers-loading">
          <div className="offers-spinner-wrap">
            <div className="offers-spinner"></div>
          </div>
          <p>Restoring your session...</p>
        </div>
      </div>
    );
  }

  // Authenticated users see the dashboard or offers view
  if (isAuthenticated) {
    if (currentView === "offers") {
      return <Offers onBack={() => setCurrentView("dashboard")} />;
    }

    return <Dashboard onOpenOffers={() => setCurrentView("offers")} />;
  }

  // Unauthenticated users see the landing/auth page
  return <Landing onLogin={login} />;
}
