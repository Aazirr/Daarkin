import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middlewares/auth-middleware.js", () => ({
  authMiddleware: (req, _res, next) => {
    req.userId = "user-test-1";
    next();
  },
}));

vi.mock("../services/notes.service.js", () => ({
  createNewNote: vi.fn(),
  getNotes: vi.fn(),
  removeNote: vi.fn(),
  updateExistingNote: vi.fn(),
  validateApplicationId: vi.fn(),
  validateCreatePayload: vi.fn(),
  validateNoteId: vi.fn(),
  validateUpdatePayload: vi.fn(),
}));

import notesRouter from "./notes.routes.js";
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

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.requestId = "test-request-id";
    res.locals.responseMeta = {
      requestId: "test-request-id",
      timestamp: "2026-01-01T00:00:00.000Z",
      method: req.method,
      path: req.originalUrl,
    };
    res.setHeader("x-request-id", "test-request-id");
    next();
  });
  app.use("/api", notesRouter);
  return app;
}

describe("notes routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    validateApplicationId.mockReturnValue({
      success: true,
      data: { applicationId: "app-1" },
    });

    validateCreatePayload.mockReturnValue({
      success: true,
      data: { noteText: "Test note" },
    });

    validateNoteId.mockReturnValue({
      success: true,
      data: { id: "note-1" },
    });

    validateUpdatePayload.mockReturnValue({
      success: true,
      data: { noteText: "Updated note" },
    });
  });

  it("lists notes for an application as authenticated user", async () => {
    getNotes.mockResolvedValue([
      {
        id: "note-1",
        applicationId: "app-1",
        noteText: "First interview",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "note-2",
        applicationId: "app-1",
        noteText: "Follow-up sent",
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);

    const app = createTestApp();
    const response = await request(app).get("/api/applications/app-1/notes");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.notes).toHaveLength(2);
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(response.body.meta.requestId).toBe("test-request-id");
    expect(getNotes).toHaveBeenCalledWith("app-1", "user-test-1");
  });

  it("returns validation error for invalid application id", async () => {
    validateApplicationId.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          formErrors: [],
          fieldErrors: {
            applicationId: ["Invalid format"],
          },
        }),
      },
    });

    const app = createTestApp();
    const response = await request(app).get("/api/applications/invalid-id/notes");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.headers["x-request-id"]).toBe("test-request-id");
  });

  it("creates note for application", async () => {
    createNewNote.mockResolvedValue({
      id: "note-3",
      applicationId: "app-1",
      noteText: "Test note",
      createdAt: "2026-01-03T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app).post("/api/applications/app-1/notes").send({
      noteText: "Test note",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.note.id).toBe("note-3");
    expect(response.body.data.note.noteText).toBe("Test note");
    expect(createNewNote).toHaveBeenCalledWith("app-1", "user-test-1", { noteText: "Test note" });
  });

  it("returns not found when creating note for non-existent application", async () => {
    createNewNote.mockResolvedValue(null);

    const app = createTestApp();
    const response = await request(app).post("/api/applications/app-404/notes").send({
      noteText: "Test note",
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("returns validation error for invalid create payload", async () => {
    validateCreatePayload.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({
          formErrors: [],
          fieldErrors: {
            noteText: ["Note text is required"],
          },
        }),
      },
    });

    const app = createTestApp();
    const response = await request(app).post("/api/applications/app-1/notes").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("updates note", async () => {
    updateExistingNote.mockResolvedValue({
      id: "note-1",
      applicationId: "app-1",
      noteText: "Updated note",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-03T00:00:00.000Z",
    });

    const app = createTestApp();
    const response = await request(app).patch("/api/notes/note-1").send({
      noteText: "Updated note",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.note.noteText).toBe("Updated note");
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(updateExistingNote).toHaveBeenCalledWith("note-1", "user-test-1", { noteText: "Updated note" });
  });

  it("returns not found when updating non-existent note", async () => {
    updateExistingNote.mockResolvedValue(null);

    const app = createTestApp();
    const response = await request(app).patch("/api/notes/note-404").send({
      noteText: "Updated note",
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deletes note", async () => {
    removeNote.mockResolvedValue(true);

    const app = createTestApp();
    const response = await request(app).delete("/api/notes/note-1");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.success).toBe(true);
    expect(removeNote).toHaveBeenCalledWith("note-1", "user-test-1");
  });

  it("returns not found when deleting non-existent note", async () => {
    removeNote.mockResolvedValue(false);

    const app = createTestApp();
    const response = await request(app).delete("/api/notes/note-404");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
