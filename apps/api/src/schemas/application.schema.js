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

export const applicationListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  status: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(APPLICATION_STATUSES).optional()
  ),
  sortBy: z
    .enum(["updatedAt", "appliedAt", "createdAt", "companyName", "status"])
    .optional()
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
