import { verifyToken } from "../services/auth.service.js";
import { createLogger } from "../utils/logger.js";
import { sendError } from "../utils/http-response.js";

const logger = createLogger("auth-middleware");

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Missing or invalid authorization header", {
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });
    return sendError(res, "Missing or invalid authorization token.", 401, "UNAUTHORIZED");
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn("Invalid or expired token", { path: req.path, requestId: req.requestId });
    return sendError(res, "Token is invalid or expired.", 401, "UNAUTHORIZED");
  }

  req.userId = decoded.userId;
  logger.info("Auth middleware passed", { userId: req.userId });
  next();
}
