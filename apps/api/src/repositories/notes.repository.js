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

export async function listNotesByApplicationId(applicationId, userId) {
  logger.info("Executing list notes query", { applicationId, userId });
  const result = await pool.query(
    `
      SELECT an.id, an.application_id, an.note_text, an.created_at, an.updated_at
      FROM application_notes an
      JOIN applications a ON an.application_id = a.id
      WHERE an.application_id = $1 AND a.user_id = $2
      ORDER BY an.created_at DESC
    `,
    [applicationId, userId]
  );

  logger.info("List notes query completed", { applicationId, userId, count: result.rowCount });
  return result.rows.map(mapNoteRow);
}

export async function getNoteById(id, userId) {
  logger.info("Executing get note query", { id, userId });
  const result = await pool.query(
    `
      SELECT an.id, an.application_id, an.note_text, an.created_at, an.updated_at
      FROM application_notes an
      JOIN applications a ON an.application_id = a.id
      WHERE an.id = $1 AND a.user_id = $2
      LIMIT 1
    `,
    [id, userId]
  );

  logger.info("Get note query completed", { id, userId, found: Boolean(result.rows[0]) });
  return result.rows[0] ? mapNoteRow(result.rows[0]) : null;
}

export async function createNote(applicationId, userId, noteText) {
  logger.info("Executing create note query", { applicationId, userId, textLength: noteText.length });
  
  // First verify the application belongs to this user
  const appCheck = await pool.query(
    "SELECT id FROM applications WHERE id = $1 AND user_id = $2 LIMIT 1",
    [applicationId, userId]
  );

  if (!appCheck.rows[0]) {
    logger.warn("Application not found or access denied", { applicationId, userId });
    return null;
  }

  const result = await pool.query(
    `
      INSERT INTO application_notes (application_id, note_text)
      VALUES ($1, $2)
      RETURNING id, application_id, note_text, created_at, updated_at
    `,
    [applicationId, noteText]
  );

  logger.info("Create note query completed", { id: result.rows[0].id, applicationId, userId });
  return mapNoteRow(result.rows[0]);
}

export async function updateNote(id, userId, noteText) {
  logger.info("Executing update note query", { id, userId, textLength: noteText.length });
  
  // Verify note belongs to user's application
  const noteCheck = await pool.query(
    `
      SELECT an.id FROM application_notes an
      JOIN applications a ON an.application_id = a.id
      WHERE an.id = $1 AND a.user_id = $2 LIMIT 1
    `,
    [id, userId]
  );

  if (!noteCheck.rows[0]) {
    logger.warn("Note not found or access denied", { id, userId });
    return null;
  }

  const result = await pool.query(
    `
      UPDATE application_notes
      SET note_text = $2
      WHERE id = $1
      RETURNING id, application_id, note_text, created_at, updated_at
    `,
    [id, noteText]
  );

  logger.info("Update note query completed", { id, userId });
  return mapNoteRow(result.rows[0]);
}

export async function deleteNote(id, userId) {
  logger.info("Executing delete note query", { id, userId });
  
  // Verify note belongs to user's application before deleting
  const noteCheck = await pool.query(
    `
      SELECT an.id FROM application_notes an
      JOIN applications a ON an.application_id = a.id
      WHERE an.id = $1 AND a.user_id = $2 LIMIT 1
    `,
    [id, userId]
  );

  if (!noteCheck.rows[0]) {
    logger.warn("Note not found or access denied for delete", { id, userId });
    return false;
  }

  const result = await pool.query(
    "DELETE FROM application_notes WHERE id = $1 RETURNING id",
    [id]
  );

  logger.info("Delete note query completed", { id, userId, deleted: result.rowCount > 0 });
  return result.rowCount > 0;
}
