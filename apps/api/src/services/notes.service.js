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

export async function getNotes(applicationId) {
  logger.info("Getting notes for application", { applicationId });
  return listNotesByApplicationId(applicationId);
}

export async function getNote(noteId) {
  logger.info("Getting note", { noteId });
  return getNoteById(noteId);
}

export async function createNewNote(applicationId, body) {
  logger.info("Creating new note", { applicationId });
  const normalized = normalizeCreatePayload(body);
  return createNote(applicationId, normalized.noteText);
}

export async function updateExistingNote(noteId, body) {
  logger.info("Updating note", { noteId });
  const normalized = normalizeUpdatePayload(body);
  return updateNote(noteId, normalized.noteText);
}

export async function removeNote(noteId) {
  logger.info("Removing note", { noteId });
  return deleteNote(noteId);
}
