import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("notes-repository");

function mapNoteRow(row) {
  return {
    id: row.id,
    applicationId: row.application_id,
    noteText: row.note_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotesByApplicationId(applicationId) {
  logger.info("Executing list notes query", { applicationId });
  const result = await pool.query(
    `
      SELECT id, application_id, note_text, created_at, updated_at
      FROM application_notes
      WHERE application_id = $1
      ORDER BY created_at DESC
    `,
    [applicationId]
  );

  logger.info("List notes query completed", { applicationId, count: result.rowCount });
  return result.rows.map(mapNoteRow);
}

export async function getNoteById(id) {
  logger.info("Executing get note query", { id });
  const result = await pool.query(
    `
      SELECT id, application_id, note_text, created_at, updated_at
      FROM application_notes
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  logger.info("Get note query completed", { found: Boolean(result.rows[0]) });
  return result.rows[0] ? mapNoteRow(result.rows[0]) : null;
}

export async function createNote(applicationId, noteText) {
  logger.info("Executing create note query", { applicationId, textLength: noteText.length });
  const result = await pool.query(
    `
      INSERT INTO application_notes (application_id, note_text)
      VALUES ($1, $2)
      RETURNING id, application_id, note_text, created_at, updated_at
    `,
    [applicationId, noteText]
  );

  logger.info("Create note query completed", { id: result.rows[0].id, applicationId });
  return mapNoteRow(result.rows[0]);
}

export async function updateNote(id, noteText) {
  logger.info("Executing update note query", { id, textLength: noteText.length });
  const result = await pool.query(
    `
      UPDATE application_notes
      SET note_text = $2
      WHERE id = $1
      RETURNING id, application_id, note_text, created_at, updated_at
    `,
    [id, noteText]
  );

  logger.info("Update note query completed", { id, found: result.rowCount > 0 });
  return result.rows[0] ? mapNoteRow(result.rows[0]) : null;
}

export async function deleteNote(id) {
  logger.info("Executing delete note query", { id });
  const result = await pool.query("DELETE FROM application_notes WHERE id = $1 RETURNING id", [id]);
  logger.info("Delete note query completed", { id, deleted: result.rowCount > 0 });
  return result.rowCount > 0;
}
