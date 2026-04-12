import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import applicationsRoutes from "./routes/applications.routes.js";
import healthRoutes from "./routes/health.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import notesRoutes from "./routes/notes.routes.js";
import authRoutes from "./routes/auth.routes.js";
import compensationRoutes from "./routes/compensation.routes.js";
import scoringWeightsRoutes from "./routes/scoring-weights.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { createLogger } from "./utils/logger.js";
import { sendError } from "./utils/http-response.js";

const app = express();
const logger = createLogger("http");

app.use(cors());

app.use((req, res, next) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.locals.responseMeta = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
  };
  res.setHeader("x-request-id", requestId);
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const elapsedMs = Date.now() - startedAt;
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode}`, {
      requestId: req.requestId,
      elapsedMs,
    });
  });

  logger.info(`Incoming ${req.method} ${req.originalUrl}`, { requestId: req.requestId });
  next();
});

app.use("/api", healthRoutes);
app.use("/api", metaRoutes);
// Auth routes (public - no auth middleware)
app.use("/api", authRoutes);
// Protected routes (require auth middleware)
app.use("/api", compensationRoutes);
app.use("/api", scoringWeightsRoutes);
app.use("/api", applicationsRoutes);
app.use("/api", notesRoutes);

app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
  });
  return sendError(res, "Route not found.", 404, "NOT_FOUND");
});

app.use(errorHandler);

export default app;
