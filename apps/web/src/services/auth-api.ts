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

const API_BASE = "/api";

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

/**
 * Logout (client-side only, clears stored auth data)
 */
export function logoutUser(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
