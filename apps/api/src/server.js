import app from "./app.js";
import env from "./config/env.js";
import { createLogger } from "./utils/logger.js";

const logger = createLogger("server");

app.listen(env.port, () => {
  logger.info(`API server running on port ${env.port}`);
});
