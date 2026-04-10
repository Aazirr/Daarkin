import { sendError } from "../utils/http-response.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  return sendError(
    res,
    err.message || "Unexpected server error.",
    err.statusCode || 500,
    err.code || "INTERNAL_ERROR",
    err.details || null
  );
}
