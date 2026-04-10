import { Router } from "express";
import {
  createNewApplication,
  getApplication,
  getApplications,
  removeApplication,
  updateExistingApplication,
  validateApplicationId,
  validateCreatePayload,
  validateUpdatePayload,
} from "../services/applications.service.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("applications-route");

// All application routes require authentication
router.use(authMiddleware);

router.get("/applications", async (req, res, next) => {
  try {
    logger.info("List applications requested", { userId: req.userId });
    const applications = await getApplications(req.userId);
    logger.info("List applications completed", { userId: req.userId, count: applications.length });
    return sendSuccess(res, { applications });
  } catch (error) {
    return next(error);
  }
});

router.get("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      logger.warn("Get application validation failed", { id: req.params.id, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Get application requested", { id: idResult.data.id, userId: req.userId });

    const application = await getApplication(idResult.data.id, req.userId);

    if (!application) {
      logger.warn("Application not found", { id: idResult.data.id, userId: req.userId });
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    logger.info("Get application completed", { id: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { application });
  } catch (error) {
    return next(error);
  }
});

router.post("/applications", async (req, res, next) => {
  try {
    const result = validateCreatePayload(req.body);

    if (!result.success) {
      logger.warn("Create application validation failed", { userId: req.userId });
      return sendError(res, "Invalid application payload.", 400, "VALIDATION_ERROR", result.error.flatten());
    }

    logger.info("Create application requested", {
      userId: req.userId,
      companyName: result.data.companyName,
      positionTitle: result.data.positionTitle,
      status: result.data.status,
    });

    const application = await createNewApplication(req.userId, result.data);
    logger.info("Create application completed", { userId: req.userId, id: application.id });
    return sendSuccess(res, { application }, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      logger.warn("Update application validation failed", { id: req.params.id, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateUpdatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Update application payload validation failed", { id: idResult.data.id, userId: req.userId });
      return sendError(res, "Invalid application payload.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Update application requested", { id: idResult.data.id, userId: req.userId, fields: Object.keys(bodyResult.data) });

    const application = await updateExistingApplication(idResult.data.id, req.userId, bodyResult.data);

    if (!application) {
      logger.warn("Application not found for update", { id: idResult.data.id, userId: req.userId });
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    logger.info("Update application completed", { id: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { application });
  } catch (error) {
    return next(error);
  }
});

router.delete("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      logger.warn("Delete application validation failed", { id: req.params.id, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Delete application requested", { id: idResult.data.id, userId: req.userId });

    const deleted = await removeApplication(idResult.data.id, req.userId);

    if (!deleted) {
      logger.warn("Application not found for delete", { id: idResult.data.id, userId: req.userId });
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    logger.info("Delete application completed", { id: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
