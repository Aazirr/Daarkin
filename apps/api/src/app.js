import express from "express";
import cors from "cors";
import applicationsRoutes from "./routes/applications.routes.js";
import healthRoutes from "./routes/health.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import notesRoutes from "./routes/notes.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { createLogger } from "./utils/logger.js";

const app = express();
const logger = createLogger("http");

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const elapsedMs = Date.now() - startedAt;
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode}`, { elapsedMs });
  });

  logger.info(`Incoming ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", healthRoutes);
app.use("/api", metaRoutes);
app.use("/api", applicationsRoutes);
app.use("/api", notesRoutes);

app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: "NOT_FOUND",
      message: "Route not found.",
      details: null,
    },
    meta: null,
  });
});

app.use(errorHandler);

export default app;
