import { Router } from "express";
import {
  createNewNote,
  getNotes,
  removeNote,
  updateExistingNote,
  validateApplicationId,
  validateCreatePayload,
  validateNoteId,
  validateUpdatePayload,
} from "../services/notes.service.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("notes-route");

router.get("/applications/:applicationId/notes", async (req, res, next) => {
  try {
    const appIdResult = validateApplicationId(req.params);

    if (!appIdResult.success) {
      logger.warn("List notes validation failed", { applicationId: req.params.applicationId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", appIdResult.error.flatten());
    }

    logger.info("List notes requested", { applicationId: appIdResult.data.applicationId });

    const notes = await getNotes(appIdResult.data.applicationId);

    logger.info("List notes completed", { applicationId: appIdResult.data.applicationId, count: notes.length });

    return sendSuccess(res, { notes });
  } catch (error) {
    return next(error);
  }
});

router.post("/applications/:applicationId/notes", async (req, res, next) => {
  try {
    const appIdResult = validateApplicationId(req.params);

    if (!appIdResult.success) {
      logger.warn("Create note app id validation failed", { applicationId: req.params.applicationId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", appIdResult.error.flatten());
    }

    const bodyResult = validateCreatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Create note body validation failed", { applicationId: appIdResult.data.applicationId });
      return sendError(res, "Invalid note data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Create note requested", { applicationId: appIdResult.data.applicationId });

    const note = await createNewNote(appIdResult.data.applicationId, bodyResult.data);

    logger.info("Create note completed", { noteId: note.id, applicationId: appIdResult.data.applicationId });

    return sendSuccess(res, { note }, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/notes/:id", async (req, res, next) => {
  try {
    const idResult = validateNoteId(req.params);

    if (!idResult.success) {
      logger.warn("Update note validation failed", { id: req.params.id });
      return sendError(res, "Invalid note id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateUpdatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Update note body validation failed", { id: idResult.data.id });
      return sendError(res, "Invalid note data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Update note requested", { id: idResult.data.id });

    const note = await updateExistingNote(idResult.data.id, bodyResult.data);

    if (!note) {
      logger.warn("Note not found", { id: idResult.data.id });
      return sendError(res, "Note not found.", 404, "NOT_FOUND");
    }

    logger.info("Update note completed", { id: idResult.data.id });

    return sendSuccess(res, { note });
  } catch (error) {
    return next(error);
  }
});

router.delete("/notes/:id", async (req, res, next) => {
  try {
    const idResult = validateNoteId(req.params);

    if (!idResult.success) {
      logger.warn("Delete note validation failed", { id: req.params.id });
      return sendError(res, "Invalid note id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Delete note requested", { id: idResult.data.id });

    const deleted = await removeNote(idResult.data.id);

    if (!deleted) {
      logger.warn("Note not found for deletion", { id: idResult.data.id });
      return sendError(res, "Note not found.", 404, "NOT_FOUND");
    }

    logger.info("Delete note completed", { id: idResult.data.id });

    return sendSuccess(res, { success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
