import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/auth-middleware.js", () => ({
  authMiddleware: (req, _res, next) => {
    req.userId = "user-test-1";
    next();
  },
}));

vi.mock("../services/application-events.service.js", () => ({
  createNewApplicationEvent: vi.fn(),
  getApplicationEvents: vi.fn(),
  getUpcomingApplicationEvents: vi.fn(),
  removeApplicationEvent: vi.fn(),
  updateExistingApplicationEvent: vi.fn(),
  validateApplicationId: vi.fn(),
  validateCreatePayload: vi.fn(),
  validateEventId: vi.fn(),
  validateUpcomingQuery: vi.fn(),
  validateUpdatePayload: vi.fn(),
}));

import applicationEventsRouter from "./application-events.routes.js";
import {
  createNewApplicationEvent,
  getApplicationEvents,
  getUpcomingApplicationEvents,
  removeApplicationEvent,
  updateExistingApplicationEvent,
  validateApplicationId,
  validateCreatePayload,
  validateEventId,
  validateUpcomingQuery,
  validateUpdatePayload,
} from "../services/application-events.service.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.requestId = "test-request-id";
    res.locals.responseMeta = {
      requestId: "test-request-id",
      timestamp: "2026-01-01T00:00:00.000Z",
      method: req.method,
      path: req.originalUrl,
    };
    next();
  });
  app.use("/api", applicationEventsRouter);
  return app;
}

describe("application events routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    validateApplicationId.mockReturnValue({
      success: true,
      data: { applicationId: "app-1" },
    });

    validateEventId.mockReturnValue({
      success: true,
      data: { id: "event-1" },
    });

    validateCreatePayload.mockReturnValue({
      success: true,
      data: {
        eventType: "interview",
        title: "Recruiter screen",
        startsAt: "2026-04-25T09:00:00.000Z",
      },
    });

    validateUpdatePayload.mockReturnValue({
      success: true,
      data: {
        title: "Hiring manager interview",
      },
    });

    validateUpcomingQuery.mockReturnValue({
      success: true,
      data: {
        days: 2,
      },
    });
  });

  it("lists events for an application", async () => {
    getApplicationEvents.mockResolvedValue([
      {
        id: "event-1",
        applicationId: "app-1",
        eventType: "interview",
        title: "Recruiter screen",
      },
    ]);

    const app = createTestApp();
    const response = await request(app).get("/api/applications/app-1/events");

    expect(response.status).toBe(200);
    expect(response.body.data.events).toHaveLength(1);
    expect(getApplicationEvents).toHaveBeenCalledWith("app-1", "user-test-1");
  });

  it("creates an event for an application", async () => {
    createNewApplicationEvent.mockResolvedValue({
      id: "event-1",
      applicationId: "app-1",
      eventType: "interview",
      title: "Recruiter screen",
    });

    const app = createTestApp();
    const response = await request(app).post("/api/applications/app-1/events").send({
      eventType: "interview",
      title: "Recruiter screen",
      startsAt: "2026-04-25T09:00:00.000Z",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.event.id).toBe("event-1");
  });

  it("updates an event", async () => {
    updateExistingApplicationEvent.mockResolvedValue({
      id: "event-1",
      title: "Hiring manager interview",
    });

    const app = createTestApp();
    const response = await request(app).patch("/api/events/event-1").send({
      title: "Hiring manager interview",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.event.title).toBe("Hiring manager interview");
  });

  it("deletes an event", async () => {
    removeApplicationEvent.mockResolvedValue(true);

    const app = createTestApp();
    const response = await request(app).delete("/api/events/event-1");

    expect(response.status).toBe(200);
    expect(response.body.data.deleted).toBe(true);
  });

  it("lists upcoming events", async () => {
    getUpcomingApplicationEvents.mockResolvedValue([
      {
        id: "event-1",
        title: "Recruiter screen",
        companyName: "Acme",
      },
    ]);

    const app = createTestApp();
    const response = await request(app).get("/api/events/upcoming?days=2");

    expect(response.status).toBe(200);
    expect(response.body.data.events).toHaveLength(1);
    expect(getUpcomingApplicationEvents).toHaveBeenCalledWith("user-test-1", { days: 2 });
  });
});
