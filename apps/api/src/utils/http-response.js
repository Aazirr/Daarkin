import { createErrorResponse, createSuccessResponse } from "@jat/shared";

function mergeMeta(res, meta) {
  const requestMeta = res.locals?.responseMeta || null;

  if (requestMeta && meta) {
    return { ...requestMeta, ...meta };
  }

  return meta || requestMeta;
}

export function sendSuccess(res, data, statusCode = 200, meta = null) {
  return res.status(statusCode).json(createSuccessResponse(data, mergeMeta(res, meta)));
}

export function sendError(res, message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
  return res.status(statusCode).json(createErrorResponse(message, code, details, mergeMeta(res, null)));
}
