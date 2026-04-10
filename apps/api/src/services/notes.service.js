import {
  noteIdSchema,
  applicationIdSchema,
  noteCreateSchema,
  noteUpdateSchema,
} from "../schemas/note.schema.js";
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotesByApplicationId,
  updateNote,
} from "../repositories/notes.repository.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("notes-service");

function normalizeCreatePayload(payload) {
  return {
    noteText: payload.noteText.trim(),
  };
}

function normalizeUpdatePayload(payload) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(payload, "noteText")) {
    normalized.noteText = payload.noteText.trim();
  }

  return normalized;
}

export function validateNoteId(params) {
  return noteIdSchema.safeParse(params);
}

export function validateApplicationId(params) {
  return applicationIdSchema.safeParse(params);
}

export function validateCreatePayload(body) {
  return noteCreateSchema.safeParse(body);
}

export function validateUpdatePayload(body) {
  return noteUpdateSchema.safeParse(body);
}

export async function getNotes(applicationId, userId) {
  logger.info("Getting notes for application", { applicationId, userId });
  return listNotesByApplicationId(applicationId, userId);
}

export async function getNote(noteId, userId) {
  logger.info("Getting note", { noteId, userId });
  return getNoteById(noteId, userId);
}

export async function createNewNote(applicationId, userId, body) {
  logger.info("Creating new note", { applicationId, userId });
  const normalized = normalizeCreatePayload(body);
  return createNote(applicationId, userId, normalized.noteText);
}

export async function updateExistingNote(noteId, userId, body) {
  logger.info("Updating note", { noteId, userId });
  const normalized = normalizeUpdatePayload(body);
  return updateNote(noteId, userId, normalized.noteText);
}

export async function removeNote(noteId, userId) {
  logger.info("Removing note", { noteId, userId });
  return deleteNote(noteId, userId);
}
