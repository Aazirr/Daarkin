import { z } from "zod";

export const noteIdSchema = z.object({
  id: z.string().uuid(),
});

export const applicationIdSchema = z.object({
  applicationId: z.string().uuid(),
});

export const noteCreateSchema = z.object({
  noteText: z
    .string()
    .trim()
    .min(1, "Note text is required.")
    .max(2000, "Note text cannot exceed 2000 characters."),
});

export const noteUpdateSchema = noteCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required to update a note.",
  }
);
