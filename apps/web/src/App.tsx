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
  const { isAuthenticated, loading, login, sessionExpired, clearSessionExpired } = useAuth();
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
  let content = <Landing onLogin={login} />;

  if (isAuthenticated) {
    if (currentView === "offers") {
      content = (
        <Offers
          onBack={() => {
            localStorage.setItem("dashboardViewMode", "list");
            setCurrentView("dashboard");
          }}
          onOpenBoard={() => {
            localStorage.setItem("dashboardViewMode", "kanban");
            setCurrentView("dashboard");
          }}
        />
      );
    } else {
      content = <Dashboard onOpenOffers={() => setCurrentView("offers")} />;
    }
  }

  return (
    <>
      {content}
      {sessionExpired ? (
        <div className="import-modal-scrim" role="presentation">
          <div
            className="import-modal session-expired-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-header">
              <h2 id="session-expired-title">Session Expired</h2>
            </div>
            <p>Your login session expired, so we signed you out. Please log in again to continue.</p>
            <div className="row-actions">
              <button type="button" className="btn btn-primary" onClick={clearSessionExpired}>
                Log In Again
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
