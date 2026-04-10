import { createErrorResponse, createSuccessResponse } from "@jat/shared";

export function sendSuccess(res, data, statusCode = 200, meta = null) {
  return res.status(statusCode).json(createSuccessResponse(data, meta));
}

export function sendError(res, message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
  return res.status(statusCode).json(createErrorResponse(message, code, details));
}
