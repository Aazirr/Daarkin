import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/auth-middleware.js", () => ({
  authMiddleware: (req, _res, next) => {
    req.userId = "user-test-1";
    next();
  },
}));

vi.mock("../services/applications.service.js", () => ({
  createNewApplication: vi.fn(),
  getApplication: vi.fn(),
  getApplications: vi.fn(),
  removeApplication: vi.fn(),
  updateExistingApplication: vi.fn(),
  validateApplicationId: vi.fn(),
  validateCreatePayload: vi.fn(),
  validateListQuery: vi.fn(),
  validateUpdatePayload: vi.fn(),
}));

import applicationsRouter from "./applications.routes.js";
import {
  createNewApplication,
  getApplications,
  removeApplication,
  updateExistingApplication,
  validateApplicationId,
  validateCreatePayload,
  validateListQuery,
  validateUpdatePayload,
} from "../services/applications.service.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", applicationsRouter);
  return app;
}

describe("applications routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    validateListQuery.mockReturnValue({
      success: true,
      data: {
        q: "",
        status: undefined,
        sortBy: "updatedAt",
        sortOrder: "desc",
        page: 1,
        pageSize: 10,
      },
    });

    validateApplicationId.mockReturnValue({
      success: true,
      data: { id: "app-1" },
    });

    validateCreatePayload.mockReturnValue({
      success: true,
      data: {
        companyName: "Acme",
        positionTitle: "Backend Engineer",
        status: "applied",
      },
    });

    validateUpdatePayload.mockReturnValue({
      success: true,
      data: { status: "interview" },
    });
  });

  it("lists applications for authenticated user", async () => {
    getApplications.mockResolvedValue({
      applications: [
        {
          id: "app-1",
          companyName: "Acme",
          positionTitle: "Backend Engineer",
          status: "applied",
        },
      ],
      total: 1,
    });

    const app = createTestApp();
    const response = await request(app).get("/api/applications");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.applications).toHaveLength(1);
    expect(response.body.meta.pagination.total).toBe(1);
    expect(getApplications).toHaveBeenCalledWith("user-test-1", expect.any(Object));
  });

  it("returns validation error for invalid create payload", async () => {
    validateCreatePayload.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          formErrors: [],
          fieldErrors: {
            companyName: ["Company is required"],
          },
        }),
      },
    });

    const app = createTestApp();
    const response = await request(app).post("/api/applications").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns not found when update target is missing", async () => {
    updateExistingApplication.mockResolvedValue(null);

    const app = createTestApp();
    const response = await request(app).patch("/api/applications/app-404").send({ status: "offer" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("returns deleted true when delete succeeds", async () => {
    removeApplication.mockResolvedValue(true);

    const app = createTestApp();
    const response = await request(app).delete("/api/applications/app-1");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.deleted).toBe(true);
    expect(removeApplication).toHaveBeenCalledWith("app-1", "user-test-1");
  });

  it("creates application for authenticated user", async () => {
    createNewApplication.mockResolvedValue({
      id: "app-2",
      companyName: "Acme",
      positionTitle: "Backend Engineer",
      status: "applied",
    });

    const app = createTestApp();
    const response = await request(app).post("/api/applications").send({
      companyName: "Acme",
      positionTitle: "Backend Engineer",
      status: "applied",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.application.id).toBe("app-2");
    expect(createNewApplication).toHaveBeenCalledWith(
      "user-test-1",
      expect.objectContaining({
        companyName: "Acme",
        positionTitle: "Backend Engineer",
      })
    );
  });
});
