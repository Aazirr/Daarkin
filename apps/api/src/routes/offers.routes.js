import { Router } from "express";
import { listOffers, getOffer } from "../services/offers.service.js";
import { sendSuccess, sendError } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

const router = Router();
const logger = createLogger("offers-route");

// GET /api/offers - Get all offers for user with compensation and scoring
router.get("/offers", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    logger.info("List offers requested", { userId });

    const result = await listOffers(userId);

    logger.info("List offers completed", { userId, count: result.count });

    return sendSuccess(res, result);
  } catch (error) {
    logger.error("Error listing offers", { error: error.message });
    return sendError(res, "Failed to list offers.", 500, "INTERNAL_SERVER_ERROR");
  }
});

// GET /api/offers/:id - Get single offer with compensation and score
router.get("/offers/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    logger.info("Get offer requested", { id, userId });

    const result = await getOffer(id, userId);

    if (!result) {
      logger.error("Offer not found or not an offer status", { id, userId });
      return sendError(res, "Offer not found.", 404, "NOT_FOUND");
    }

    logger.info("Get offer completed", { id, userId });

    return sendSuccess(res, result);
  } catch (error) {
    logger.error("Error fetching offer", { error: error.message });
    return sendError(res, "Failed to fetch offer.", 500, "INTERNAL_SERVER_ERROR");
  }
});

export default router;
