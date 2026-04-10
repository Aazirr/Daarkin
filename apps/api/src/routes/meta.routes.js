import { Router } from "express";
import { APPLICATION_STATUSES } from "@jat/shared";
import { sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("meta");

router.get("/meta/statuses", (req, res) => {
  logger.info("Status metadata requested", { count: APPLICATION_STATUSES.length });
  return sendSuccess(res, {
    statuses: APPLICATION_STATUSES,
  });
});

export default router;
