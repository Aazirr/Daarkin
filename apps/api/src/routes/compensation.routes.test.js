import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/auth-middleware.js", () => ({
  authMiddleware: (req, _res, next) => {
    req.userId = "user-test-1";
    next();
  },
}));

vi.mock("../services/compensation.service.js", () => ({
  createCompensation: vi.fn(),
  deleteCompensation: vi.fn(),
  getCompensation: vi.fn(),
  updateCompensation: vi.fn(),
  validateApplicationId: vi.fn(),
  validateCreatePayload: vi.fn(),
  validateUpdatePayload: vi.fn(),
}));

import compensationRouter from "./compensation.routes.js";
import {
  createCompensation,
  deleteCompensation,
  getCompensation,
  updateCompensation,
  validateApplicationId,
  validateCreatePayload,
  validateUpdatePayload,
} from "../services/compensation.service.js";

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
    res.setHeader("x-request-id", "test-request-id");
    next();
  });
  app.use("/api", compensationRouter);
  return app;
}

describe("compensation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    validateApplicationId.mockReturnValue({
      success: true,
      data: { id: "app-1" },
    });

    validateCreatePayload.mockReturnValue({
      success: true,
      data: {
        baseSalary: 150000,
        bonusSalary: 30000,
        currency: "USD",
        payCadence: "annual",
      },
    });

    validateUpdatePayload.mockReturnValue({
      success: true,
      data: { baseSalary: 160000 },
    });
  });

  it("gets compensation for an application", async () => {
    getCompensation.mockResolvedValue({
      id: "comp-1",
      application_id: "app-1",
      base_salary: 150000,
      bonus_salary: 30000,
      currency: "USD",
      pay_cadence: "annual",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app).get("/api/applications/app-1/compensation");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.compensation).toHaveProperty("base_salary");
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(response.body.meta.requestId).toBe("test-request-id");
    expect(getCompensation).toHaveBeenCalledWith("app-1", "user-test-1");
  });

  it("returns null when compensation does not exist", async () => {
    getCompensation.mockResolvedValue(null);

    const app = createTestApp();
    const response = await request(app).get("/api/applications/app-1/compensation");

    expect(response.status).toBe(200);
    expect(response.body.data.compensation).toBeNull();
  });

  it("creates compensation for application", async () => {
    createCompensation.mockResolvedValue({
      id: "comp-1",
      application_id: "app-1",
      base_salary: 150000,
      bonus_salary: 30000,
      currency: "USD",
      pay_cadence: "annual",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app)
      .post("/api/applications/app-1/compensation")
      .send({
        baseSalary: 150000,
        bonusSalary: 30000,
        currency: "USD",
        payCadence: "annual",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.compensation.base_salary).toBe(150000);
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(createCompensation).toHaveBeenCalledWith(
      "app-1",
      "user-test-1",
      expect.objectContaining({
        baseSalary: 150000,
      })
    );
  });

  it("returns validation error for invalid create payload", async () => {
    validateCreatePayload.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          formErrors: [],
          fieldErrors: {
            baseSalary: ["Base salary must be a positive number."],
          },
        }),
      },
    });

    const app = createTestApp();
    const response = await request(app)
      .post("/api/applications/app-1/compensation")
      .send({
        baseSalary: -100,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("updates compensation for application", async () => {
    updateCompensation.mockResolvedValue({
      id: "comp-1",
      application_id: "app-1",
      base_salary: 160000,
      bonus_salary: 30000,
      currency: "USD",
      pay_cadence: "annual",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app)
      .patch("/api/applications/app-1/compensation")
      .send({ baseSalary: 160000 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.compensation.base_salary).toBe(160000);
    expect(updateCompensation).toHaveBeenCalledWith(
      "app-1",
      "user-test-1",
      expect.objectContaining({ baseSalary: 160000 })
    );
  });

  it("returns not found when updating non-existent compensation", async () => {
    updateCompensation.mockResolvedValue(null);

    const app = createTestApp();
    const response = await request(app)
      .patch("/api/applications/app-1/compensation")
      .send({ baseSalary: 160000 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deletes compensation for application", async () => {
    deleteCompensation.mockResolvedValue(true);

    const app = createTestApp();
    const response = await request(app).delete("/api/applications/app-1/compensation");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.success).toBe(true);
    expect(deleteCompensation).toHaveBeenCalledWith("app-1", "user-test-1");
  });

  it("returns not found when deleting non-existent compensation", async () => {
    deleteCompensation.mockResolvedValue(false);

    const app = createTestApp();
    const response = await request(app).delete("/api/applications/app-1/compensation");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("returns validation error for invalid application id", async () => {
    validateApplicationId.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          formErrors: [],
          fieldErrors: {
            id: ["Invalid format"],
          },
        }),
      },
    });

    const app = createTestApp();
    const response = await request(app).get("/api/applications/invalid-id/compensation");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
