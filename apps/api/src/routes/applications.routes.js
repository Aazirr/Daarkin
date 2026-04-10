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
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("applications-route");

router.get("/applications", async (req, res, next) => {
  try {
    logger.info("List applications requested");
    const applications = await getApplications();
    logger.info("List applications completed", { count: applications.length });
    return sendSuccess(res, { applications });
  } catch (error) {
    return next(error);
  }
});

router.get("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      logger.warn("Get application validation failed", { id: req.params.id });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Get application requested", { id: idResult.data.id });

    const application = await getApplication(idResult.data.id);

    if (!application) {
      logger.warn("Application not found", { id: idResult.data.id });
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    logger.info("Get application completed", { id: idResult.data.id });

    return sendSuccess(res, { application });
  } catch (error) {
    return next(error);
  }
});

router.post("/applications", async (req, res, next) => {
  try {
    const result = validateCreatePayload(req.body);

    if (!result.success) {
      logger.warn("Create application validation failed");
      return sendError(res, "Invalid application payload.", 400, "VALIDATION_ERROR", result.error.flatten());
    }

    logger.info("Create application requested", {
      companyName: result.data.companyName,
      positionTitle: result.data.positionTitle,
      status: result.data.status,
    });

    const application = await createNewApplication(result.data);
    logger.info("Create application completed", { id: application.id });
    return sendSuccess(res, { application }, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      logger.warn("Update application validation failed", { id: req.params.id });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateUpdatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Update application payload validation failed", { id: idResult.data.id });
      return sendError(res, "Invalid application payload.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Update application requested", { id: idResult.data.id, fields: Object.keys(bodyResult.data) });

    const application = await updateExistingApplication(idResult.data.id, bodyResult.data);

    if (!application) {
      logger.warn("Application not found for update", { id: idResult.data.id });
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    logger.info("Update application completed", { id: idResult.data.id });

    return sendSuccess(res, { application });
  } catch (error) {
    return next(error);
  }
});

router.delete("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      logger.warn("Delete application validation failed", { id: req.params.id });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Delete application requested", { id: idResult.data.id });

    const deleted = await removeApplication(idResult.data.id);

    if (!deleted) {
      logger.warn("Application not found for delete", { id: idResult.data.id });
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    logger.info("Delete application completed", { id: idResult.data.id });

    return sendSuccess(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
