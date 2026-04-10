import { createContext, useState, useEffect, ReactNode } from "react";
import type { User } from "../services/auth-api";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * Manages authentication state and persists session to localStorage
 * 
 * On mount:
 * - Attempts to restore user and token from localStorage
 * - Sets loading=false when restoration is complete
 * 
 * Session persistence:
 * - Stores token and user JSON in localStorage on login
 * - Clears localStorage on logout
 * - Automatically restores session on page reload
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount (session hydration)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  function login(newToken: string, newUser: User): void {
    setToken(newToken);
    setUser(newUser);
    // Persist to localStorage for session recovery on page reload
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  }

  function logout(): void {
    setToken(null);
    setUser(null);
    // Clear persisted session data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
