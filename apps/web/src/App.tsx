import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Landing from "./Landing";
import Home from "./Home";
import Dashboard from "./Dashboard";
import Offers from "./Offers";

function createApplicationsIntent(overrides = {}) {
  return {
    target: "applications",
    viewMode: "list",
    focusImport: false,
    importSeed: "",
    statusFilter: "all",
    focusMode: null,
    page: 1,
    pageSize: 10,
    sortBy: "updatedAt",
    sortOrder: "desc",
    ...overrides,
  };
}

const THEME_STORAGE_KEY = "uiTheme";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

/**
 * Main App Router Component
 * Routes between Landing (auth), Home, Applications, and Offers view
 * Handles session restoration from localStorage on app startup
 */
export default function App() {
  const { isAuthenticated, loading, login, sessionExpired, clearSessionExpired } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [applicationsIntent, setApplicationsIntent] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function openHome() {
    setApplicationsIntent(null);
    setCurrentView("home");
  }

  function openApplications(intentOverrides = {}) {
    const nextIntent = createApplicationsIntent(intentOverrides);
    localStorage.setItem("dashboardViewMode", nextIntent.viewMode);
    setApplicationsIntent(nextIntent);
    setCurrentView("applications");
  }

  function openBoard() {
    openApplications({ viewMode: "kanban" });
  }

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
  let content = <Landing onLogin={login} theme={theme} onToggleTheme={toggleTheme} />;

  if (isAuthenticated) {
    if (currentView === "home") {
      content = (
        <Home
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenApplications={(intentOverrides) => openApplications(intentOverrides)}
          onOpenBoard={openBoard}
          onOpenOffers={() => setCurrentView("offers")}
          onQuickImport={(importSeed) =>
            openApplications({
              focusImport: true,
              importSeed,
              pageSize: 100,
            })
          }
          onReviewFollowUps={() =>
            openApplications({
              focusMode: "follow-ups",
              pageSize: 100,
              sortOrder: "asc",
            })
          }
        />
      );
    } else if (currentView === "offers") {
      content = (
        <Offers
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenHome={openHome}
          onOpenApplications={() => openApplications()}
          onOpenBoard={openBoard}
        />
      );
    } else {
      content = (
        <Dashboard
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenHome={openHome}
          onOpenOffers={() => setCurrentView("offers")}
          navigationIntent={applicationsIntent}
          onNavigationIntentConsumed={() => setApplicationsIntent(null)}
        />
      );
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
