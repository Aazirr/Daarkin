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
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { sendError, sendSuccess } from "../utils/http-response.js";
import { createLogger } from "../utils/logger.js";

const router = Router();
const logger = createLogger("notes-route");

// All notes routes require authentication
router.use(authMiddleware);

router.get("/applications/:applicationId/notes", async (req, res, next) => {
  try {
    const appIdResult = validateApplicationId(req.params);

    if (!appIdResult.success) {
      logger.warn("List notes validation failed", { applicationId: req.params.applicationId, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", appIdResult.error.flatten());
    }

    logger.info("List notes requested", { applicationId: appIdResult.data.applicationId, userId: req.userId });

    const notes = await getNotes(appIdResult.data.applicationId, req.userId);

    logger.info("List notes completed", { applicationId: appIdResult.data.applicationId, userId: req.userId, count: notes.length });

    return sendSuccess(res, { notes });
  } catch (error) {
    return next(error);
  }
});

router.post("/applications/:applicationId/notes", async (req, res, next) => {
  try {
    const appIdResult = validateApplicationId(req.params);

    if (!appIdResult.success) {
      logger.warn("Create note app id validation failed", { applicationId: req.params.applicationId, userId: req.userId });
      return sendError(res, "Invalid application id.", 400, "VALIDATION_ERROR", appIdResult.error.flatten());
    }

    const bodyResult = validateCreatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Create note body validation failed", { applicationId: appIdResult.data.applicationId, userId: req.userId });
      return sendError(res, "Invalid note data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Create note requested", { applicationId: appIdResult.data.applicationId, userId: req.userId });

    const note = await createNewNote(appIdResult.data.applicationId, req.userId, bodyResult.data);

    if (!note) {
      logger.warn("Application not found or access denied", { applicationId: appIdResult.data.applicationId, userId: req.userId });
      return sendError(res, "Application not found.", 404, "NOT_FOUND");
    }

    logger.info("Create note completed", { noteId: note.id, applicationId: appIdResult.data.applicationId, userId: req.userId });

    return sendSuccess(res, { note }, 201);
  } catch (error) {
    return next(error);
  }
});

router.patch("/notes/:id", async (req, res, next) => {
  try {
    const idResult = validateNoteId(req.params);

    if (!idResult.success) {
      logger.warn("Update note validation failed", { id: req.params.id, userId: req.userId });
      return sendError(res, "Invalid note id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    const bodyResult = validateUpdatePayload(req.body);

    if (!bodyResult.success) {
      logger.warn("Update note body validation failed", { id: idResult.data.id, userId: req.userId });
      return sendError(res, "Invalid note data.", 400, "VALIDATION_ERROR", bodyResult.error.flatten());
    }

    logger.info("Update note requested", { id: idResult.data.id, userId: req.userId });

    const note = await updateExistingNote(idResult.data.id, req.userId, bodyResult.data);

    if (!note) {
      logger.warn("Note not found or access denied", { id: idResult.data.id, userId: req.userId });
      return sendError(res, "Note not found.", 404, "NOT_FOUND");
    }

    logger.info("Update note completed", { id: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { note });
  } catch (error) {
    return next(error);
  }
});

router.delete("/notes/:id", async (req, res, next) => {
  try {
    const idResult = validateNoteId(req.params);

    if (!idResult.success) {
      logger.warn("Delete note validation failed", { id: req.params.id, userId: req.userId });
      return sendError(res, "Invalid note id.", 400, "VALIDATION_ERROR", idResult.error.flatten());
    }

    logger.info("Delete note requested", { id: idResult.data.id, userId: req.userId });

    const deleted = await removeNote(idResult.data.id, req.userId);

    if (!deleted) {
      logger.warn("Note not found for deletion or access denied", { id: idResult.data.id, userId: req.userId });
      return sendError(res, "Note not found.", 404, "NOT_FOUND");
    }

    logger.info("Delete note completed", { id: idResult.data.id, userId: req.userId });

    return sendSuccess(res, { success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
