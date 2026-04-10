import { Router } from "express";
import { pingDatabase } from "../config/db.js";
import { sendSuccess } from "../utils/http-response.js";

const router = Router();

router.get("/health", async (req, res, next) => {
  try {
    const dbOk = await pingDatabase();
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
