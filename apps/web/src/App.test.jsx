import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.tsx";

vi.mock("./hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./Landing", () => ({
  default: () => <div data-testid="landing-view">Landing View</div>,
}));

vi.mock("./Dashboard", () => ({
  default: () => <div data-testid="dashboard-view">Dashboard View</div>,
}));

import { useAuth } from "./hooks/useAuth";

describe("App routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while auth is hydrating", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      login: vi.fn(),
    });

    render(<App />);

    expect(screen.getByText(/restoring your session/i)).toBeInTheDocument();
  });

  it("renders dashboard for authenticated users", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
    });

    render(<App />);

    expect(screen.getByTestId("dashboard-view")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
  });

  it("renders landing for unauthenticated users", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      login: vi.fn(),
    });

    render(<App />);

    expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-view")).not.toBeInTheDocument();
  });
});
