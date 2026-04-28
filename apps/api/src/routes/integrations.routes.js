import { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import {
  buildGmailConnectUrl,
  completeGmailOAuth,
  disconnectGmail,
  syncGmailMessages,
  validateGmailCallbackQuery,
  validateGmailSyncBody,
} from "../services/gmail-integration.service.js";
import { createLogger } from "../utils/logger.js";
import env from "../config/env.js";
import { z } from "zod";
import { listEmailEventsByApplicationId } from "../repositories/email-integrations.repository.js";

const router = Router();
const logger = createLogger("integrations-route");
const applicationIdParamsSchema = z.object({ applicationId: z.string().uuid() });

router.get("/integrations/gmail/connect", authMiddleware, async (req, res, next) => {
  try {
    const url = buildGmailConnectUrl(req.userId);
    return sendSuccess(res, { authUrl: url });
  } catch (error) {
    return next(error);
  }
});

router.get("/integrations/gmail/callback", async (req, res, next) => {
  try {
    const queryResult = validateGmailCallbackQuery(req.query);
    if (!queryResult.success) {
      return sendError(res, "Invalid callback query.", 400, "VALIDATION_ERROR", queryResult.error.flatten());
    }

    const result = await completeGmailOAuth(queryResult.data);
    logger.info("Gmail connected", { userId: result.userId, connectedEmail: result.connectedEmail });

    return res.redirect(`${env.appBaseUrl}/home?gmail=connected`);
  } catch (error) {
    return next(error);
  }
});

router.post("/integrations/gmail/sync", authMiddleware, async (req, res, next) => {
  try {
    const bodyResult = validateGmailSyncBody(req.body);
    if (!bodyResult.success) {
      return sendError(res, "Invalid sync payload.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    const result = await syncGmailMessages(req.userId, bodyResult.data.maxResults);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

router.delete("/integrations/gmail", authMiddleware, async (req, res, next) => {
  try {
    const deleted = await disconnectGmail(req.userId);
    return sendSuccess(res, { deleted });
  } catch (error) {
    return next(error);
  }
});

router.get("/applications/:applicationId/email-events", authMiddleware, async (req, res, next) => {
  try {
    const paramsResult = applicationIdParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", paramsResult.error.flatten());
    }

    const events = await listEmailEventsByApplicationId(req.userId, paramsResult.data.applicationId);
    return sendSuccess(res, { events });
  } catch (error) {
    return next(error);
  }
});

export default router;
