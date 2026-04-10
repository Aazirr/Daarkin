import { verifyToken } from "../services/auth.service.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("auth-middleware");

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Missing or invalid authorization header", {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization token.",
        details: null,
      },
      meta: null,
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn("Invalid or expired token", { path: req.path });
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Token is invalid or expired.",
        details: null,
      },
      meta: null,
    });
  }

  req.userId = decoded.userId;
  logger.info("Auth middleware passed", { userId: req.userId });
  next();
}
