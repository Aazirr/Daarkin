import { z } from "zod";
import { APPLICATION_STATUSES } from "@jat/shared";

const optionalText = z.string().trim().max(255).optional().or(z.literal(""));

export const applicationIdSchema = z.object({
  id: z.string().uuid(),
});

export const applicationCreateSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  positionTitle: z.string().trim().min(1, "Position title is required.").max(120),
  location: optionalText,
  applicationUrl: z.string().trim().url("Application URL must be a valid URL.").optional().or(z.literal("")),
  status: z.enum(APPLICATION_STATUSES),
  appliedAt: z.string().date().optional().or(z.literal("")),
});

export const applicationUpdateSchema = applicationCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required to update an application.",
  }
);
