import { Router } from "express";
import {
  createNewApplicationEvent,
  getApplicationEvents,
  getUpcomingApplicationEvents,
  removeApplicationEvent,
  updateExistingApplicationEvent,
  validateApplicationId,
  validateCreatePayload,
  validateEventId,
  validateUpcomingQuery,
  validateUpdatePayload,
} from "../services/application-events.service.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("application-events-route");

router.use(authMiddleware);

router.get("/applications/:applicationId/events", async (req, res, next) => {
  try {
    const appIdResult = validateApplicationId(req.params);

    if (!appIdResult.success) {
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", appIdResult.error.flatten());
    }

    const events = await getApplicationEvents(appIdResult.data.applicationId, req.userId);
    return sendSuccess(res, { events });
  } catch (error) {
    return next(error);
  }
});

router.post("/applications/:applicationId/events", async (req, res, next) => {
  try {
    const appIdResult = validateApplicationId(req.params);
    if (!appIdResult.success) {
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", appIdResult.error.flatten());
    }

    const bodyResult = validateCreatePayload(req.body);
    if (!bodyResult.success) {
      return sendError(res, "Invalid event data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    const event = await createNewApplicationEvent(appIdResult.data.applicationId, req.userId, bodyResult.data);
    if (!event) {
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    return sendSuccess(res, { event }, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/events/:id", async (req, res, next) => {
  try {
    const idResult = validateEventId(req.params);
    if (!idResult.success) {
      return sendError(res, "Invalid event id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateUpdatePayload(req.body);
    if (!bodyResult.success) {
      return sendError(res, "Invalid event data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    const event = await updateExistingApplicationEvent(idResult.data.id, req.userId, bodyResult.data);
    if (!event) {
      return sendError(res, "Event not found.", 404, "NOT_FOUND");
    }

    return sendSuccess(res, { event });
  } catch (error) {
    return next(error);
  }
});

router.delete("/events/:id", async (req, res, next) => {
  try {
    const idResult = validateEventId(req.params);
    if (!idResult.success) {
      return sendError(res, "Invalid event id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const deleted = await removeApplicationEvent(idResult.data.id, req.userId);
    if (!deleted) {
      return sendError(res, "Event not found.", 404, "NOT_FOUND");
    }

    return sendSuccess(res, { deleted: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/events/upcoming", async (req, res, next) => {
  try {
    const queryResult = validateUpcomingQuery(req.query);
    if (!queryResult.success) {
      return sendError(res, "Invalid events query.", 400, "VALIDATION_ERROR", queryResult.error.flatten());
    }

    logger.info("Upcoming events requested", { userId: req.userId, days: queryResult.data.days });

    const events = await getUpcomingApplicationEvents(req.userId, queryResult.data);
    return sendSuccess(res, { events });
  } catch (error) {
    return next(error);
  }
});

export default router;
