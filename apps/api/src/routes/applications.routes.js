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

const router = Router();

router.get("/applications", async (req, res, next) => {
  try {
    const applications = await getApplications();
    return sendSuccess(res, { applications });
  } catch (error) {
    return next(error);
  }
});

router.get("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const application = await getApplication(idResult.data.id);

    if (!application) {
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    return sendSuccess(res, { application });
  } catch (error) {
    return next(error);
  }
});

router.post("/applications", async (req, res, next) => {
  try {
    const result = validateCreatePayload(req.body);

    if (!result.success) {
      return sendError(res, "Invalid application payload.", 400, "VALIDATION_ERROR", result.error.flatten());
    }

    const application = await createNewApplication(result.data);
    return sendSuccess(res, { application }, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateUpdatePayload(req.body);

    if (!bodyResult.success) {
      return sendError(res, "Invalid application payload.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    const application = await updateExistingApplication(idResult.data.id, bodyResult.data);

    if (!application) {
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    return sendSuccess(res, { application });
  } catch (error) {
    return next(error);
  }
});

router.delete("/applications/:id", async (req, res, next) => {
  try {
    const idResult = validateApplicationId(req.params);

    if (!idResult.success) {
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const deleted = await removeApplication(idResult.data.id);

    if (!deleted) {
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    return sendSuccess(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
