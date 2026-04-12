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
  extractFromUrl: vi.fn(),
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
import { createApplication, extractFromUrl, fetchApplications, updateApplication } from "./services/applications-api.js";
import { createNote, fetchNotes, updateNote } from "./services/notes-api.js";

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

    fetchNotes.mockResolvedValue({
      notes: [],
    });
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

  it("updates status and shows success prompt when optimistic update succeeds", async () => {
    updateApplication.mockResolvedValue({
      application: {
        id: "app-1",
        companyName: "Acme",
        positionTitle: "Backend Engineer",
        status: "interview",
        location: "Remote",
        applicationUrl: "https://acme.com/jobs/1",
        appliedAt: "2026-01-01",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-06T00:00:00.000Z",
        statusChangedAt: "2026-01-06T00:00:00.000Z",
      },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalled();
    });

    const appliedStatusButton = await screen.findByRole("button", { name: /^Applied$/i });
    fireEvent.click(appliedStatusButton);

    const interviewOptions = await screen.findAllByRole("button", { name: /^Interview$/i });
    fireEvent.click(interviewOptions[0]);

    await waitFor(() => {
      expect(updateApplication).toHaveBeenCalledWith("app-1", { status: "interview" });
    });

    expect(screen.getByText(/Status updated to Interview\. Want to set a prep reminder next\?/i)).toBeInTheDocument();
  });

  it("rolls back status and shows error when optimistic update fails", async () => {
    updateApplication.mockRejectedValue(new Error("Status update failed."));

    render(<Dashboard />);

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalled();
    });

    const appliedStatusButton = await screen.findByRole("button", { name: /^Applied$/i });
    fireEvent.click(appliedStatusButton);

    const offerOptions = await screen.findAllByRole("button", { name: /^Offer$/i });
    fireEvent.click(offerOptions[0]);

    await waitFor(() => {
      expect(updateApplication).toHaveBeenCalledWith("app-1", { status: "offer" });
    });

    expect(screen.getByText(/Status update failed\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Applied$/i })).toBeInTheDocument();
  });

  it("adds new application after successful import", async () => {
    // Mock extractFromUrl to fail, which triggers fallback to local parsing
    extractFromUrl.mockRejectedValue(new Error("Extraction service unavailable"));

    createApplication.mockResolvedValue({
      application: {
        id: "app-3",
        companyName: "Gamma Corp",
        positionTitle: "Frontend Dev",
        status: "applied",
        location: "NYC",
        applicationUrl: "https://gamma.com/jobs/123",
        appliedAt: "2026-04-13",
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
        statusChangedAt: "2026-04-13T00:00:00.000Z",
      },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(fetchApplications).toHaveBeenCalled();
    });

    // Paste a URL into Quick Import
    const importInput = await screen.findByPlaceholderText(/Paste job URL/i);
    fireEvent.change(importInput, { target: { value: "https://gamma.com/jobs/frontend-dev" } });

    const extractButton = await screen.findByRole("button", { name: /Extract/i });
    fireEvent.click(extractButton);

    // Wait for draft form and verify it's rendered
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Save Application/i })).toBeInTheDocument();
    });

    // Click Save
    const saveButton = screen.getByRole("button", { name: /Save Application/i });
    fireEvent.click(saveButton);

    // Verify API called and success feedback
    await waitFor(() => {
      expect(createApplication).toHaveBeenCalled();
    });

    expect(screen.getByText(/Application added from import/i)).toBeInTheDocument();
  });
});
