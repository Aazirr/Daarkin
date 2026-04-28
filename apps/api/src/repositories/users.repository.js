import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("users-repository");

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    googleId: row.google_id ?? null,
    googleEmail: row.google_email ?? null,
    googleConnectedAt: row.google_connected_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserByEmail(email) {
  logger.info("Executing get user by email query", { email });
  const result = await pool.query(
    `
      SELECT id, email, password_hash, google_id, google_email, google_connected_at, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  logger.info("Get user by email query completed", { email, found: Boolean(result.rows[0]) });
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

export async function getUserById(id) {
  logger.info("Executing get user by id query", { id });
  const result = await pool.query(
    `
      SELECT id, email, password_hash, google_id, google_email, google_connected_at, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  logger.info("Get user by id query completed", { id, found: Boolean(result.rows[0]) });
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

export async function createUser(email, passwordHash) {
  logger.info("Executing create user query", { email });
  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash, google_id, google_email, google_connected_at, created_at, updated_at
    `,
    [email, passwordHash]
  );

  logger.info("Create user query completed", { id: result.rows[0].id, email });
  return mapUserRow(result.rows[0]);
}

export async function getUserByGoogleId(googleId) {
  logger.info("Executing get user by google id query", { googleId });
  const result = await pool.query(
    `
      SELECT id, email, password_hash, google_id, google_email, google_connected_at, created_at, updated_at
      FROM users
      WHERE google_id = $1
      LIMIT 1
    `,
    [googleId]
  );

  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

export async function createGoogleUser(email, googleId) {
  logger.info("Executing create google user query", { email, googleId });
  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash, google_id, google_email, google_connected_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, password_hash, google_id, google_email, google_connected_at, created_at, updated_at
    `,
    [email, "__oauth_google__", googleId, email]
  );

  return mapUserRow(result.rows[0]);
}

export async function attachGoogleToUser(userId, googleId, googleEmail) {
  logger.info("Attaching google account to user", { userId, googleId });
  const result = await pool.query(
    `
      UPDATE users
      SET google_id = $2,
          google_email = $3,
          google_connected_at = NOW()
      WHERE id = $1
      RETURNING id, email, password_hash, google_id, google_email, google_connected_at, created_at, updated_at
    `,
    [userId, googleId, googleEmail]
  );

  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}
