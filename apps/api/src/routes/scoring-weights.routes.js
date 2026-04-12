import { Router } from "express";
import {
  getWeights,
  updateWeights,
  validateUpdatePayload,
} from "../services/scoring-weights.service.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("scoring-weights-route");

// All scoring weights routes require authentication
router.use(authMiddleware);

router.get("/user/scoring-weights", async (req, res, next) => {
  try {
    logger.info("Get scoring weights requested", { userId: req.userId });

    const weights = await getWeights(req.userId);

    logger.info("Get scoring weights completed", { userId: req.userId });

    return sendSuccess(res, { weights });
  } catch (error) {
    return next(error);
  }
});

router.patch("/user/scoring-weights", async (req, res, next) => {
  try {
    const bodyResult = validateUpdatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Update scoring weights validation failed", { userId: req.userId });
      return sendError(res, "Invalid scoring weights data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Update scoring weights requested", { userId: req.userId });

    const weights = await updateWeights(req.userId, bodyResult.data);

    logger.info("Update scoring weights completed", { userId: req.userId });

    return sendSuccess(res, { weights });
  } catch (error) {
    return next(error);
  }
});

export default router;
