import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

vi.mock("./hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./services/applications-api.js", () => ({
  fetchApplications: vi.fn(),
  setAuthToken: vi.fn(),
}));

import { useAuth } from "./hooks/useAuth";
import { fetchApplications } from "./services/applications-api.js";

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: { id: "u1", email: "franz@example.com" },
      token: "token-1",
      logout: vi.fn(),
    });

    fetchApplications.mockResolvedValue({
      data: {
        applications: [
          {
            id: "app-1",
            companyName: "Acme",
            positionTitle: "Frontend Engineer",
            status: "applied",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "app-2",
            companyName: "Beta",
            positionTitle: "Product Designer",
            status: "interview",
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
      meta: {
        pagination: {
          total: 2,
        },
      },
    });
  });

  it("renders a guided home summary for authenticated users", async () => {
    render(
      <Home
        onOpenApplications={vi.fn()}
        onOpenBoard={vi.fn()}
        onOpenOffers={vi.fn()}
        onQuickImport={vi.fn()}
        onReviewFollowUps={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalled();
    });

    expect(screen.getByRole("heading", { name: /welcome back, franz/i })).toBeInTheDocument();
    expect(screen.getByText(/applications today/i)).toBeInTheDocument();
    expect(screen.getByText(/upcoming and reminders/i)).toBeInTheDocument();
    expect(screen.getByText(/recommended actions/i)).toBeInTheDocument();
  });

  it("hands quick import off to applications", async () => {
    const onQuickImport = vi.fn();

    render(
      <Home
        onOpenApplications={vi.fn()}
        onOpenBoard={vi.fn()}
        onOpenOffers={vi.fn()}
        onQuickImport={onQuickImport}
        onReviewFollowUps={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText(/paste a job url or company name/i), {
      target: { value: "https://example.com/jobs/frontend" },
    });

    fireEvent.click(screen.getByRole("button", { name: /start import/i }));

    expect(onQuickImport).toHaveBeenCalledWith("https://example.com/jobs/frontend");
  });
});
