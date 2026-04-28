/**
 * Auth API Service
 * Handles all authentication-related API calls (login, register, token verification)
 */

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthProfile {
  id: string;
  email: string;
  google: {
    connected: boolean;
    email: string | null;
    connectedAt: string | null;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Register a new user account
 */
export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data: ApiSuccessResponse<AuthResponse> | ApiErrorResponse = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiErrorResponse;
    throw new Error(error.error?.message || "Registration failed");
  }

  return (data as ApiSuccessResponse<AuthResponse>).data;
}

/**
 * Login with email and password
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data: ApiSuccessResponse<AuthResponse> | ApiErrorResponse = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiErrorResponse;
    throw new Error(error.error?.message || "Login failed");
  }

  return (data as ApiSuccessResponse<AuthResponse>).data;
}

export async function getGoogleLoginUrl(): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/google/start`);
  const data: ApiSuccessResponse<{ authUrl: string }> | ApiErrorResponse = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiErrorResponse;
    throw new Error(error.error?.message || "Google login start failed");
  }

  return (data as ApiSuccessResponse<{ authUrl: string }>).data.authUrl;
}

export async function getGoogleLinkUrl(token: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/google/link/start`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data: ApiSuccessResponse<{ authUrl: string }> | ApiErrorResponse = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiErrorResponse;
    throw new Error(error.error?.message || "Google link start failed");
  }

  return (data as ApiSuccessResponse<{ authUrl: string }>).data.authUrl;
}

export async function getAuthProfile(token: string): Promise<AuthProfile> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data: ApiSuccessResponse<{ user: AuthProfile }> | ApiErrorResponse = await response.json();

  if (!response.ok || !data.success) {
    const error = data as ApiErrorResponse;
    throw new Error(error.error?.message || "Failed to fetch auth profile");
  }

  return (data as ApiSuccessResponse<{ user: AuthProfile }>).data.user;
}

/**
 * Logout (client-side only, clears stored auth data)
 */
export function logoutUser(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
