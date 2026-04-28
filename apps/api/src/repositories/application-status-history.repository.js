import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("application-status-history-repository");

function mapRow(row) {
  return {
    id: row.id,
    applicationId: row.application_id,
    userId: row.user_id,
    previousStatus: row.previous_status,
    nextStatus: row.next_status,
    source: row.source,
    note: row.note,
    createdAt: row.created_at,
    companyName: row.company_name,
    positionTitle: row.position_title,
  };
}

export async function createStatusHistoryEntry(userId, payload) {
  logger.info("Creating status history entry", {
    userId,
    applicationId: payload.applicationId,
    previousStatus: payload.previousStatus,
    nextStatus: payload.nextStatus,
    source: payload.source,
  });

  const result = await pool.query(
    `
      INSERT INTO application_status_history
      (application_id, user_id, previous_status, next_status, source, note)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, application_id, user_id, previous_status, next_status, source, note, created_at
    `,
    [
      payload.applicationId,
      userId,
      payload.previousStatus ?? null,
      payload.nextStatus,
      payload.source,
      payload.note ?? null,
    ]
  );

  return mapRow(result.rows[0]);
}

export async function listStatusHistory(userId, limit = 20) {
  logger.info("Listing status history", { userId, limit });
  const result = await pool.query(
    `
      SELECT
        h.id,
        h.application_id,
        h.user_id,
        h.previous_status,
        h.next_status,
        h.source,
        h.note,
        h.created_at,
        a.company_name,
        a.position_title
      FROM application_status_history h
      JOIN applications a ON a.id = h.application_id
      WHERE h.user_id = $1
      ORDER BY h.created_at DESC
      LIMIT $2
    `,
    [userId, limit]
  );

  return result.rows.map(mapRow);
}
