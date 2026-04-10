import pg from "pg";
import env from "./env.js";
import { createLogger } from "../utils/logger.js";

const { Pool } = pg;
const logger = createLogger("db");

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

export async function pingDatabase() {
  const client = await pool.connect();
  try {
    logger.info("Running database ping");
    await client.query("SELECT 1");
    logger.info("Database ping succeeded");
    return true;
  } finally {
    client.release();
  }
}
