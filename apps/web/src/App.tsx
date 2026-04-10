import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import Landing from "./Landing";
import Dashboard from "./Dashboard";

/**
 * Main App Router Component
 * Routes between Landing (auth) and Dashboard (app) based on authentication state
 * Handles session restoration from localStorage on app startup
 */
export default function App() {
  const { isAuthenticated, loading, login } = useAuth();

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

  // Authenticated users see the dashboard
  if (isAuthenticated) {
    return <Dashboard />;
  }

  // Unauthenticated users see the landing/auth page
  return <Landing onLogin={login} />;
}
