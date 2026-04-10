import express from "express";
import cors from "cors";
import applicationsRoutes from "./routes/applications.routes.js";
import healthRoutes from "./routes/health.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", metaRoutes);
app.use("/api", applicationsRoutes);

app.use((req, res) => {
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
