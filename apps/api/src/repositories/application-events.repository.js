import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("application-events-repository");

function mapApplicationEventRow(row) {
  return {
    id: row.id,
    applicationId: row.application_id,
    eventType: row.event_type,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    companyName: row.company_name ?? null,
    positionTitle: row.position_title ?? null,
  };
}

export async function listEventsByApplicationId(applicationId, userId) {
  logger.info("Executing list application events query", { applicationId, userId });
  const result = await pool.query(
    `
      SELECT ae.id, ae.application_id, ae.event_type, ae.title, ae.starts_at, ae.ends_at, ae.notes, ae.created_at, ae.updated_at
      FROM application_events ae
      JOIN applications a ON ae.application_id = a.id
      WHERE ae.application_id = $1 AND a.user_id = $2
      ORDER BY ae.starts_at ASC
    `,
    [applicationId, userId]
  );

  return result.rows.map(mapApplicationEventRow);
}

export async function createApplicationEvent(applicationId, userId, input) {
  logger.info("Executing create application event query", { applicationId, userId, eventType: input.eventType });

  const appCheck = await pool.query(
    "SELECT id FROM applications WHERE id = $1 AND user_id = $2 LIMIT 1",
    [applicationId, userId]
  );

  if (!appCheck.rows[0]) {
    return null;
  }

  const result = await pool.query(
    `
      INSERT INTO application_events (application_id, event_type, title, starts_at, ends_at, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, application_id, event_type, title, starts_at, ends_at, notes, created_at, updated_at
    `,
    [
      applicationId,
      input.eventType,
      input.title,
      input.startsAt,
      input.endsAt ?? null,
      input.notes ?? null,
    ]
  );

  return mapApplicationEventRow(result.rows[0]);
}

export async function updateApplicationEvent(id, userId, input) {
  logger.info("Executing update application event query", { id, userId, fields: Object.keys(input) });

  const currentResult = await pool.query(
    `
      SELECT ae.id, ae.application_id, ae.event_type, ae.title, ae.starts_at, ae.ends_at, ae.notes, ae.created_at, ae.updated_at
      FROM application_events ae
      JOIN applications a ON ae.application_id = a.id
      WHERE ae.id = $1 AND a.user_id = $2
      LIMIT 1
    `,
    [id, userId]
  );

  if (!currentResult.rows[0]) {
    return null;
  }

  const current = mapApplicationEventRow(currentResult.rows[0]);
  const next = {
    eventType: input.eventType ?? current.eventType,
    title: Object.prototype.hasOwnProperty.call(input, "title") ? input.title : current.title,
    startsAt: input.startsAt ?? current.startsAt,
    endsAt: Object.prototype.hasOwnProperty.call(input, "endsAt") ? input.endsAt : current.endsAt,
    notes: Object.prototype.hasOwnProperty.call(input, "notes") ? input.notes : current.notes,
  };

  const result = await pool.query(
    `
      UPDATE application_events
      SET event_type = $2,
          title = $3,
          starts_at = $4,
          ends_at = $5,
          notes = $6
      WHERE id = $1
      RETURNING id, application_id, event_type, title, starts_at, ends_at, notes, created_at, updated_at
    `,
    [id, next.eventType, next.title, next.startsAt, next.endsAt ?? null, next.notes ?? null]
  );

  return mapApplicationEventRow(result.rows[0]);
}

export async function deleteApplicationEvent(id, userId) {
  logger.info("Executing delete application event query", { id, userId });
  const result = await pool.query(
    `
      DELETE FROM application_events ae
      USING applications a
      WHERE ae.application_id = a.id
        AND ae.id = $1
        AND a.user_id = $2
      RETURNING ae.id
    `,
    [id, userId]
  );

  return result.rowCount > 0;
}

export async function listUpcomingEvents(userId, days = 2) {
  logger.info("Executing list upcoming events query", { userId, days });
  const result = await pool.query(
    `
      SELECT
        ae.id,
        ae.application_id,
        ae.event_type,
        ae.title,
        ae.starts_at,
        ae.ends_at,
        ae.notes,
        ae.created_at,
        ae.updated_at,
        a.company_name,
        a.position_title
      FROM application_events ae
      JOIN applications a ON ae.application_id = a.id
      WHERE a.user_id = $1
        AND ae.starts_at >= NOW()
        AND ae.starts_at < NOW() + ($2::text || ' days')::interval
      ORDER BY ae.starts_at ASC
      LIMIT 10
    `,
    [userId, days]
  );

  return result.rows.map(mapApplicationEventRow);
}
