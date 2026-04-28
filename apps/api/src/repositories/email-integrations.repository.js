import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("email-integrations-repository");

function mapIntegrationRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at,
    connectedEmail: row.connected_email,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
  };
}

function mapEmailEventRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerMessageId: row.provider_message_id,
    applicationId: row.application_id,
    detectedType: row.detected_type,
    occurredAt: row.occurred_at,
    subject: row.subject,
    sender: row.sender,
    snippet: row.snippet,
    metadata: row.metadata_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertEmailIntegration(userId, provider, payload) {
  logger.info("Upserting email integration", { userId, provider });
  const result = await pool.query(
    `
      INSERT INTO email_integrations
      (user_id, provider, access_token, refresh_token, token_expires_at, connected_email)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, email_integrations.refresh_token),
        token_expires_at = EXCLUDED.token_expires_at,
        connected_email = EXCLUDED.connected_email
      RETURNING id, user_id, provider, access_token, refresh_token, token_expires_at, connected_email, connected_at, updated_at
    `,
    [
      userId,
      provider,
      payload.accessToken,
      payload.refreshToken ?? null,
      payload.tokenExpiresAt ?? null,
      payload.connectedEmail ?? null,
    ]
  );

  return mapIntegrationRow(result.rows[0]);
}

export async function getEmailIntegration(userId, provider) {
  logger.info("Getting email integration", { userId, provider });
  const result = await pool.query(
    `
      SELECT id, user_id, provider, access_token, refresh_token, token_expires_at, connected_email, connected_at, updated_at
      FROM email_integrations
      WHERE user_id = $1 AND provider = $2
      LIMIT 1
    `,
    [userId, provider]
  );

  return result.rows[0] ? mapIntegrationRow(result.rows[0]) : null;
}

export async function deleteEmailIntegration(userId, provider) {
  logger.info("Deleting email integration", { userId, provider });
  const result = await pool.query(
    "DELETE FROM email_integrations WHERE user_id = $1 AND provider = $2 RETURNING id",
    [userId, provider]
  );
  return result.rowCount > 0;
}

export async function createEmailEventIfNotExists(userId, payload) {
  logger.info("Creating email event", { userId, providerMessageId: payload.providerMessageId, provider: payload.provider });
  const result = await pool.query(
    `
      INSERT INTO email_events
      (
        user_id, provider, provider_message_id, application_id, detected_type, occurred_at, subject, sender, snippet, metadata_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      ON CONFLICT (user_id, provider, provider_message_id)
      DO NOTHING
      RETURNING id, user_id, provider, provider_message_id, application_id, detected_type, occurred_at, subject, sender, snippet, metadata_json, created_at, updated_at
    `,
    [
      userId,
      payload.provider,
      payload.providerMessageId,
      payload.applicationId ?? null,
      payload.detectedType,
      payload.occurredAt,
      payload.subject ?? null,
      payload.sender ?? null,
      payload.snippet ?? null,
      JSON.stringify(payload.metadata ?? {}),
    ]
  );

  return result.rows[0] ? mapEmailEventRow(result.rows[0]) : null;
}

export async function listEmailEventsByApplicationId(userId, applicationId) {
  logger.info("Listing email events by application", { userId, applicationId });
  const result = await pool.query(
    `
      SELECT id, user_id, provider, provider_message_id, application_id, detected_type, occurred_at, subject, sender, snippet, metadata_json, created_at, updated_at
      FROM email_events
      WHERE user_id = $1 AND application_id = $2
      ORDER BY occurred_at DESC
      LIMIT 50
    `,
    [userId, applicationId]
  );

  return result.rows.map(mapEmailEventRow);
}
