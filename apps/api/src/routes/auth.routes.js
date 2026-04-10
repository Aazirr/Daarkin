import { Router } from "express";
import {
  validateRegisterPayload,
  validateLoginPayload,
  register,
  login,
} from "../services/auth.service.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("auth-route");

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

export default router;
