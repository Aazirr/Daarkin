import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/auth-middleware.js", () => ({
  authMiddleware: (req, _res, next) => {
    req.userId = "user-test-1";
    next();
  },
}));

vi.mock("../services/scoring-weights.service.js", () => ({
  getWeights: vi.fn(),
  updateWeights: vi.fn(),
  validateUpdatePayload: vi.fn(),
}));

import scoringWeightsRouter from "./scoring-weights.routes.js";
import {
  getWeights,
  updateWeights,
  validateUpdatePayload,
} from "../services/scoring-weights.service.js";

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
  app.use("/api", scoringWeightsRouter);
  return app;
}

describe("scoring weights routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    validateUpdatePayload.mockReturnValue({
      success: true,
      data: {
        weightBaseSalary: 0.40,
      },
    });
  });

  it("gets scoring weights for authenticated user", async () => {
    getWeights.mockResolvedValue({
      user_id: "user-test-1",
      weight_base_salary: 0.35,
      weight_bonus: 0.15,
      weight_equity: 0.20,
      weight_benefits: 0.10,
      weight_remote: 0.10,
      weight_career_growth: 0.10,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app).get("/api/user/scoring-weights");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.weights).toHaveProperty("weight_base_salary");
    expect(response.body.data.weights.weight_base_salary).toBe(0.35);
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(response.body.meta.requestId).toBe("test-request-id");
    expect(getWeights).toHaveBeenCalledWith("user-test-1");
  });

  it("returns default weights when user has no custom weights", async () => {
    getWeights.mockResolvedValue({
      user_id: "user-test-1",
      weight_base_salary: 0.35,
      weight_bonus: 0.15,
      weight_equity: 0.20,
      weight_benefits: 0.10,
      weight_remote: 0.10,
      weight_career_growth: 0.10,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app).get("/api/user/scoring-weights");

    expect(response.status).toBe(200);
    expect(response.body.data.weights.weight_base_salary).toBe(0.35);
  });

  it("updates scoring weights for authenticated user", async () => {
    updateWeights.mockResolvedValue({
      user_id: "user-test-1",
      weight_base_salary: 0.40,
      weight_bonus: 0.15,
      weight_equity: 0.20,
      weight_benefits: 0.10,
      weight_remote: 0.10,
      weight_career_growth: 0.05,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app)
      .patch("/api/user/scoring-weights")
      .send({
        weightBaseSalary: 0.40,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.weights.weight_base_salary).toBe(0.40);
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(updateWeights).toHaveBeenCalledWith(
      "user-test-1",
      expect.objectContaining({
        weightBaseSalary: 0.40,
      })
    );
  });

  it("supports updating multiple weights", async () => {
    validateUpdatePayload.mockReturnValue({
      success: true,
      data: {
        weightBaseSalary: 0.40,
        weightBonus: 0.20,
        weightEquity: 0.15,
      },
    });

    updateWeights.mockResolvedValue({
      user_id: "user-test-1",
      weight_base_salary: 0.40,
      weight_bonus: 0.20,
      weight_equity: 0.15,
      weight_benefits: 0.10,
      weight_remote: 0.10,
      weight_career_growth: 0.05,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app)
      .patch("/api/user/scoring-weights")
      .send({
        weightBaseSalary: 0.40,
        weightBonus: 0.20,
        weightEquity: 0.15,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.weights.weight_base_salary).toBe(0.40);
    expect(response.body.data.weights.weight_bonus).toBe(0.20);
    expect(response.body.data.weights.weight_equity).toBe(0.15);
  });

  it("returns validation error for invalid weights", async () => {
    validateUpdatePayload.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          formErrors: [],
          fieldErrors: {
            weightBaseSalary: ["Weight must be <= 1."],
          },
        }),
      },
    });

    const app = createTestApp();
    const response = await request(app)
      .patch("/api/user/scoring-weights")
      .send({
        weightBaseSalary: 1.5,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns validation error when no weights provided", async () => {
    validateUpdatePayload.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          formErrors: ["At least one weight is required to update scoring preferences."],
          fieldErrors: {},
        }),
      },
    });

    const app = createTestApp();
    const response = await request(app)
      .patch("/api/user/scoring-weights")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
