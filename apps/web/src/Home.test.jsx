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

vi.mock("./services/events-api.js", () => ({
  fetchUpcomingEvents: vi.fn(),
  setAuthToken: vi.fn(),
}));

import { useAuth } from "./hooks/useAuth";
import { fetchApplications } from "./services/applications-api.js";
import { fetchUpcomingEvents } from "./services/events-api.js";

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

    fetchUpcomingEvents.mockResolvedValue({
      events: [],
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

  it("routes follow-up guidance into applications with a guided intent", async () => {
    const onOpenApplications = vi.fn();

    render(
      <Home
        onOpenApplications={onOpenApplications}
        onOpenBoard={vi.fn()}
        onOpenOffers={vi.fn()}
        onQuickImport={vi.fn()}
        onReviewFollowUps={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /needs follow-up/i }));

    expect(onOpenApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        focusMode: "follow-ups",
        pageSize: 100,
        sortOrder: "asc",
      })
    );
  });

  it("surfaces upcoming interview reminders from real events", async () => {
    fetchUpcomingEvents.mockResolvedValue({
      events: [
        {
          id: "event-1",
          eventType: "interview",
          title: "Hiring manager interview",
          startsAt: new Date().toISOString(),
          companyName: "Acme",
        },
      ],
    });

    render(
      <Home
        onOpenApplications={vi.fn()}
        onOpenBoard={vi.fn()}
        onOpenOffers={vi.fn()}
        onQuickImport={vi.fn()}
        onReviewFollowUps={vi.fn()}
      />
    );

    expect(await screen.findByText(/Interview today with Acme/i)).toBeInTheDocument();
  });
});
