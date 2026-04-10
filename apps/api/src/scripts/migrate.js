import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import env from "../config/env.js";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../../../../database/migrations");
const migrationLockId = 902314;

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const pool = new Pool({ connectionString: env.databaseUrl });

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function readMigrationFiles() {
  const files = await fs.readdir(migrationsDir);
  return files.filter((file) => file.endsWith(".sql")).sort();
}

async function run() {
  const client = await pool.connect();
  let inTransaction = false;
  let hasLock = false;

  try {
    await client.query("SELECT pg_advisory_lock($1)", [migrationLockId]);
    hasLock = true;

    await ensureMigrationsTable(client);

    const result = await client.query("SELECT filename FROM schema_migrations");
    const applied = new Set(result.rows.map((row) => row.filename));

    const files = await readMigrationFiles();

    for (const filename of files) {
      if (applied.has(filename)) {
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, filename), "utf8");

      await client.query("BEGIN");
      inTransaction = true;
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
      await client.query("COMMIT");
      inTransaction = false;

      console.log(`Applied migration: ${filename}`);
    }

    if (!files.length) {
      console.log("No migration files found.");
    }

    console.log("Migrations complete.");
  } catch (error) {
    if (inTransaction) {
      await client.query("ROLLBACK");
      inTransaction = false;
    }
    throw error;
  } finally {
    if (hasLock) {
      await client.query("SELECT pg_advisory_unlock($1)", [migrationLockId]);
    }
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
