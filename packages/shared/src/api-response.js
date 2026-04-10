export function createSuccessResponse(data, meta = null) {
  return {
    success: true,
    data,
    error: null,
    meta,
  };
}

export function createErrorResponse(message, code = "INTERNAL_ERROR", details = null) {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
    meta: null,
  };
}
