import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import * as offersService from "../services/offers.service.js";

const TEST_AUTH_HEADER = "Bearer test-token";
const TEST_USER_ID = "user-test-1";

vi.mock("../middlewares/auth-middleware.js", () => ({
  authMiddleware: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    req.userId = TEST_USER_ID;
    next();
  },
}));

vi.mock("../services/offers.service.js", () => ({
  listOffers: vi.fn(),
  getOffer: vi.fn(),
}));

describe("offers routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/offers", () => {
    it("lists all offers with compensation and scores", async () => {
      const mockOffers = [
        {
          id: "app-1",
          companyName: "TechCorp",
          positionTitle: "Senior Engineer",
          status: "offer",
          compensation: {
            baseSalary: 180000,
            bonusSalary: 30000,
            currency: "USD",
            locationType: "remote",
          },
          score: 92,
        },
        {
          id: "app-2",
          companyName: "StartupXYZ",
          positionTitle: "Lead Engineer",
          status: "offer",
          compensation: {
            baseSalary: 160000,
            bonusSalary: 20000,
            stockEquity: "5000 shares",
            currency: "USD",
            locationType: "hybrid",
          },
          score: 85,
        },
      ];

      offersService.listOffers.mockResolvedValue({
        offers: mockOffers,
        count: 2,
        weights: {
          baseSalaryWeight: 0.35,
          bonusSalaryWeight: 0.15,
          stockEquityWeight: 0.2,
          benefitsWeight: 0.1,
          remoteWeight: 0.1,
          growthWeight: 0.1,
        },
      });

      const response = await request(app)
        .get("/api/offers")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toHaveLength(2);
      expect(response.body.data.offers[0].score).toBe(92);
      expect(response.body.data.offers[1].score).toBe(85);
      expect(response.body.data.count).toBe(2);
    });

    it("returns empty array when user has no offers", async () => {
      offersService.listOffers.mockResolvedValue({
        offers: [],
        count: 0,
        weights: {
          baseSalaryWeight: 0.35,
          bonusSalaryWeight: 0.15,
          stockEquityWeight: 0.2,
          benefitsWeight: 0.1,
          remoteWeight: 0.1,
          growthWeight: 0.1,
        },
      });

      const response = await request(app)
        .get("/api/offers")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.offers).toHaveLength(0);
    });

    it("returns offers sorted by score descending", async () => {
      const mockOffers = [
        {
          id: "app-1",
          companyName: "Best",
          status: "offer",
          compensation: { baseSalary: 200000 },
          score: 95,
        },
        {
          id: "app-2",
          companyName: "Good",
          status: "offer",
          compensation: { baseSalary: 150000 },
          score: 80,
        },
        {
          id: "app-3",
          companyName: "Okay",
          status: "offer",
          compensation: { baseSalary: 120000 },
          score: 70,
        },
      ];

      offersService.listOffers.mockResolvedValue({
        offers: mockOffers,
        count: 3,
        weights: {
          baseSalaryWeight: 0.35,
          bonusSalaryWeight: 0.15,
          stockEquityWeight: 0.2,
          benefitsWeight: 0.1,
          remoteWeight: 0.1,
          growthWeight: 0.1,
        },
      });

      const response = await request(app)
        .get("/api/offers")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.data.offers[0].score).toBe(95);
      expect(response.body.data.offers[1].score).toBe(80);
      expect(response.body.data.offers[2].score).toBe(70);
    });

    it("includes weights in response for client-side scoring", async () => {
      offersService.listOffers.mockResolvedValue({
        offers: [],
        count: 0,
        weights: {
          baseSalaryWeight: 0.35,
          bonusSalaryWeight: 0.15,
          stockEquityWeight: 0.2,
          benefitsWeight: 0.1,
          remoteWeight: 0.1,
          growthWeight: 0.1,
        },
      });

      const response = await request(app)
        .get("/api/offers")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.data.weights).toBeDefined();
      expect(response.body.data.weights.baseSalaryWeight).toBe(0.35);
    });

    it("returns 401 when not authenticated", async () => {
      const response = await request(app).get("/api/offers");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/offers/:id", () => {
    it("returns single offer with score and weights", async () => {
      const mockOffer = {
        id: "app-1",
        companyName: "TechCorp",
        positionTitle: "Senior Engineer",
        status: "offer",
        compensation: {
          baseSalary: 180000,
          bonusSalary: 30000,
          currency: "USD",
          locationType: "remote",
        },
        score: 92,
      };

      offersService.getOffer.mockResolvedValue({
        offer: mockOffer,
        weights: {
          baseSalaryWeight: 0.35,
          bonusSalaryWeight: 0.15,
          stockEquityWeight: 0.2,
          benefitsWeight: 0.1,
          remoteWeight: 0.1,
          growthWeight: 0.1,
        },
      });

      const response = await request(app)
        .get("/api/offers/app-1")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.offer.id).toBe("app-1");
      expect(response.body.data.offer.score).toBe(92);
      expect(response.body.data.offer.compensation.baseSalary).toBe(180000);
    });

    it("returns 404 when offer not found", async () => {
      offersService.getOffer.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/offers/nonexistent")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("returns 404 when application exists but is not an offer", async () => {
      offersService.getOffer.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/offers/app-applied")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("includes requestId in response metadata", async () => {
      const mockOffer = {
        id: "app-1",
        status: "offer",
        compensation: { baseSalary: 150000 },
        score: 85,
      };

      offersService.getOffer.mockResolvedValue({
        offer: mockOffer,
        weights: {
          baseSalaryWeight: 0.35,
          bonusSalaryWeight: 0.15,
          stockEquityWeight: 0.2,
          benefitsWeight: 0.1,
          remoteWeight: 0.1,
          growthWeight: 0.1,
        },
      });

      const response = await request(app)
        .get("/api/offers/app-1")
        .set("Authorization", TEST_AUTH_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.meta.requestId).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
    });

    it("returns 401 when not authenticated", async () => {
      const response = await request(app).get("/api/offers/app-1");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
