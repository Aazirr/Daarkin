import { Router } from "express";
import { pingDatabase } from "../config/db.js";
import { sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("health");

router.get("/health", async (req, res, next) => {
  try {
    logger.info("Health check requested");
    let dbOk = false;

    try {
      dbOk = await pingDatabase();
    } catch (error) {
      logger.warn("Health check database ping failed", { message: error.message });
      dbOk = false;
    }

    logger.info("Health check completed", { database: dbOk ? "connected" : "disconnected" });

    return sendSuccess(res, {
      service: "job-application-tracker-api",
      status: "ok",
      database: dbOk ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
