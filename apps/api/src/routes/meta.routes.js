import { Router } from "express";
import { APPLICATION_STATUSES } from "@jat/shared";
import { sendSuccess } from "../utils/http-response.js";

const router = Router();

router.get("/meta/statuses", (req, res) => {
  return sendSuccess(res, {
    statuses: APPLICATION_STATUSES,
  });
});

export default router;
