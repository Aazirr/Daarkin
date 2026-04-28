import { Router } from "express";
import { z } from "zod";
import {
  validateRegisterPayload,
  validateLoginPayload,
  register,
  login,
  getAuthProfile,
} from "../services/auth.service.js";
import { buildGoogleAuthUrl, completeGoogleAuth } from "../services/google-auth.service.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";
import env from "../config/env.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";

const router = Router();
const logger = createLogger("auth-route");
const googleCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

router.post("/register", async (req, res, next) => {
  try {
    const payloadResult = validateRegisterPayload(req.body);

    if (!payloadResult.success) {
      logger.warn("Register validation failed");
      return sendError(res, "Invalid registration data.", 400, "VALIDATION_ERROR", payloadResult.error.flatten());
    }

    logger.info("Register request received", { email: payloadResult.data.email });

    const result = await register(payloadResult.data.email, payloadResult.data.password);

    logger.info("User registered successfully", { userId: result.user.id });

    return sendSuccess(res, result, 201);
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payloadResult = validateLoginPayload(req.body);

    if (!payloadResult.success) {
      logger.warn("Login validation failed");
      return sendError(res, "Invalid login data.", 400, "VALIDATION_ERROR", payloadResult.error.flatten());
    }

    logger.info("Login request received", { email: payloadResult.data.email });

    const result = await login(payloadResult.data.email, payloadResult.data.password);

    logger.info("User logged in successfully", { userId: result.user.id });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/google/start", async (req, res, next) => {
  try {
    const authUrl = buildGoogleAuthUrl("login");
    return sendSuccess(res, { authUrl });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/google/link/start", authMiddleware, async (req, res, next) => {
  try {
    const authUrl = buildGoogleAuthUrl("link", req.userId);
    return sendSuccess(res, { authUrl });
  } catch (error) {
    return next(error);
  }
});

router.get("/auth/google/callback", async (req, res, next) => {
  try {
    const queryResult = googleCallbackQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return sendError(res, "Invalid Google callback query.", 400, "VALIDATION_ERROR", queryResult.error.flatten());
    }

    const result = await completeGoogleAuth(queryResult.data.code, queryResult.data.state);

    if (result.mode === "link") {
      return res.redirect(`${env.appBaseUrl}/?googleLinked=1`);
    }

    const userEncoded = Buffer.from(JSON.stringify(result.user), "utf-8").toString("base64url");
    return res.redirect(`${env.appBaseUrl}/?authProvider=google&token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(userEncoded)}`);
  } catch (error) {
    logger.error("Google auth callback failed", { error: error.message });
    return res.redirect(`${env.appBaseUrl}/?authProvider=google&error=${encodeURIComponent(error.message || "Google authentication failed.")}`);
  }
});

router.get("/auth/me", authMiddleware, async (req, res, next) => {
  try {
    const profile = await getAuthProfile(req.userId);
    if (!profile) {
      return sendError(res, "User not found.", 404, "NOT_FOUND");
    }
    return sendSuccess(res, { user: profile });
  } catch (error) {
    return next(error);
  }
});

export default router;
