import { useContext } from "react";
import { AuthContext, AuthContextValue } from "../context/AuthContext";

/**
 * Hook for accessing auth context
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
