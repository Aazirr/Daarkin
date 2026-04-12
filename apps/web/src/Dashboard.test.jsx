import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("./hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./services/applications-api.js", () => ({
  fetchApplications: vi.fn(),
  createApplication: vi.fn(),
  deleteApplication: vi.fn(),
  setAuthToken: vi.fn(),
  updateApplication: vi.fn(),
}));

vi.mock("./services/notes-api.js", () => ({
  fetchNotes: vi.fn(),
  createNote: vi.fn(),
  setAuthToken: vi.fn(),
  updateNote: vi.fn(),
}));

import { useAuth } from "./hooks/useAuth";
import { fetchApplications } from "./services/applications-api.js";

function buildResponse(applications) {
  return {
    data: { applications },
    meta: {
      pagination: {
        page: 1,
        pageSize: 10,
        total: applications.length,
        totalPages: 1,
      },
    },
  };
}

describe("Dashboard interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useAuth.mockReturnValue({
      user: { id: "u1", email: "user@example.com" },
      token: "token-1",
      logout: vi.fn(),
    });

    fetchApplications.mockResolvedValue(
      buildResponse([
        {
          id: "app-1",
          companyName: "Acme",
          positionTitle: "Backend Engineer",
          status: "applied",
          location: "Remote",
          applicationUrl: "https://acme.com/jobs/1",
          appliedAt: "2026-01-01",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          statusChangedAt: "2026-01-02T00:00:00.000Z",
        },
        {
          id: "app-2",
          companyName: "Beta",
          positionTitle: "Frontend Engineer",
          status: "interview",
          location: "Remote",
          applicationUrl: "https://beta.com/jobs/2",
          appliedAt: "2026-01-03",
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-04T00:00:00.000Z",
          statusChangedAt: "2026-01-04T00:00:00.000Z",
        },
      ])
    );
  });

  it("applies interview pipeline filter after clicking segment", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalledTimes(1);
    });

    const interviewSegment = await screen.findByRole("button", {
      name: /Interview segment, 1 applications/i,
    });

    fireEvent.click(interviewSegment);

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalledTimes(2);
    });

    const secondCallQuery = fetchApplications.mock.calls[1][0];
    expect(secondCallQuery).toEqual(
      expect.objectContaining({
        status: "interview",
      })
    );
  });
});
