import { Router } from "express";
import {
  createCompensation,
  deleteCompensation,
  getCompensation,
  updateCompensation,
  validateApplicationId,
  validateCreatePayload,
  validateUpdatePayload,
} from "../services/compensation.service.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("compensation-route");

// All compensation routes require authentication
router.use(authMiddleware);

router.get("/applications/:id/compensation", async (req, res, next) => {
  try {
    const idResult = validateApplicationId({ id: req.params.id });

    if (!idResult.success) {
      logger.warn("Get compensation validation failed", { applicationId: req.params.id, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Get compensation requested", { applicationId: idResult.data.id, userId: req.userId });

    const compensation = await getCompensation(idResult.data.id, req.userId);

    logger.info("Get compensation completed", { applicationId: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { compensation: compensation || null });
  } catch (error) {
    return next(error);
  }
});

router.post("/applications/:id/compensation", async (req, res, next) => {
  try {
    const idResult = validateApplicationId({ id: req.params.id });

    if (!idResult.success) {
      logger.warn("Create compensation app id validation failed", { applicationId: req.params.id, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateCreatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Create compensation body validation failed", { applicationId: idResult.data.id, userId: req.userId });
      return sendError(res, "Invalid compensation data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Create compensation requested", { applicationId: idResult.data.id, userId: req.userId });

    const compensation = await createCompensation(idResult.data.id, req.userId, bodyResult.data);

    logger.info("Create compensation completed", { applicationId: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { compensation }, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/applications/:id/compensation", async (req, res, next) => {
  try {
    const idResult = validateApplicationId({ id: req.params.id });

    if (!idResult.success) {
      logger.warn("Update compensation validation failed", { applicationId: req.params.id, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateUpdatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Update compensation body validation failed", { applicationId: idResult.data.id, userId: req.userId });
      return sendError(res, "Invalid compensation data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Update compensation requested", { applicationId: idResult.data.id, userId: req.userId });

    const compensation = await updateCompensation(idResult.data.id, req.userId, bodyResult.data);

    if (!compensation) {
      logger.warn("Compensation not found for update", { applicationId: idResult.data.id, userId: req.userId });
      return sendError(res, "Compensation not found.", 404, "NOT_FOUND");
    }

    logger.info("Update compensation completed", { applicationId: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { compensation });
  } catch (error) {
    return next(error);
  }
});

router.delete("/applications/:id/compensation", async (req, res, next) => {
  try {
    const idResult = validateApplicationId({ id: req.params.id });

    if (!idResult.success) {
      logger.warn("Delete compensation validation failed", { applicationId: req.params.id, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Delete compensation requested", { applicationId: idResult.data.id, userId: req.userId });

    const deleted = await deleteCompensation(idResult.data.id, req.userId);

    if (!deleted) {
      logger.warn("Compensation not found for deletion", { applicationId: idResult.data.id, userId: req.userId });
      return sendError(res, "Compensation not found.", 404, "NOT_FOUND");
    }

    logger.info("Delete compensation completed", { applicationId: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
