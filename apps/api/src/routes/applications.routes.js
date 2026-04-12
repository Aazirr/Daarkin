import { Router } from "express";
import {
  createNewApplication,
  getApplication,
  getApplications,
  removeApplication,
  updateExistingApplication,
  validateApplicationId,
  validateCreatePayload,
  validateListQuery,
  validateUpdatePayload,
} from "../services/applications.service.js";
import { extractJobDataFromUrl, calculateOverallConfidence } from "../services/url-extraction.service.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("applications-route");

// All application routes require authentication
router.use(authMiddleware);

// Extract job data from URL (Phase 8)
router.post("/applications/extract-from-url", async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      logger.warn("Extract from URL validation failed - missing or invalid URL", { userId: req.userId });
      return sendError(res, "URL is required and must be a string.", 400, "VALIDATION_ERROR");
    }

    logger.info("Extract from URL requested", { userId: req.userId, url });

    const extracted = await extractJobDataFromUrl(url);
    const overallConfidence = calculateOverallConfidence(extracted);

    logger.info("Extract from URL completed", { userId: req.userId, confidence: overallConfidence });

    return sendSuccess(
      res,
      {
        extracted: {
          ...extracted,
          overallConfidence,
          sourceUrl: url,
        },
      },
      200
    );
  } catch (error) {
    logger.error("Extract from URL failed", { userId: req.userId, error: error.message });
    return sendError(res, error.message, 400, "EXTRACTION_ERROR");
  }
});

router.get("/applications", async (req, res, next) => {
  try {
    const queryResult = validateListQuery(req.query);

    if (!queryResult.success) {
      logger.warn("List applications query validation failed", { userId: req.userId });
      return sendError(res, "Invalid list query parameters.", 400, "VALIDATION_ERROR", queryResult.error.flatten());
    }

    logger.info("List applications requested", { userId: req.userId, query: queryResult.data });

    const { applications, total } = await getApplications(req.userId, queryResult.data);
    const totalPages = Math.ceil(total / queryResult.data.pageSize) || 1;

    logger.info("List applications completed", {
      userId: req.userId,
      count: applications.length,
      total,
      page: queryResult.data.page,
      pageSize: queryResult.data.pageSize,
    });

    return sendSuccess(
      res,
      { applications },
      200,
      {
        pagination: {
          page: queryResult.data.page,
          pageSize: queryResult.data.pageSize,
          total,
          totalPages,
        },
        filters: {
          q: queryResult.data.q,
          status: queryResult.data.status || null,
          sortBy: queryResult.data.sortBy,
          sortOrder: queryResult.data.sortOrder,
        },
      }
    );
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
