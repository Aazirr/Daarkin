import { sendError } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("errors");

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  logger.error(`${req.method} ${req.originalUrl} failed`, {
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "Unexpected server error.",
  });

  return sendError(
    res,
    err.message || "Unexpected server error.",
    err.statusCode || 500,
    err.code || "INTERNAL_ERROR",
    err.details || null
  );
}
