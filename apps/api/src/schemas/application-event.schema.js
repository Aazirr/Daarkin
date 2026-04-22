import { z } from "zod";

const eventTypeSchema = z.enum(["interview", "follow_up", "offer_deadline", "custom"]);

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const applicationEventIdSchema = z.object({
  id: z.string().uuid(),
});

export const applicationEventApplicationIdSchema = z.object({
  applicationId: z.string().uuid(),
});

const applicationEventBaseSchema = z.object({
  eventType: eventTypeSchema.default("interview"),
  title: z
    .string()
    .trim()
    .min(1, "Event title is required.")
    .max(120, "Event title cannot exceed 120 characters."),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema.optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(2000, "Event notes cannot exceed 2000 characters.")
    .optional()
    .nullable(),
});

export const applicationEventCreateSchema = applicationEventBaseSchema.refine((value) => {
  if (!value.endsAt) {
    return true;
  }

  return new Date(value.endsAt).getTime() >= new Date(value.startsAt).getTime();
}, {
  message: "End time must be after the start time.",
  path: ["endsAt"],
});

export const applicationEventUpdateSchema = applicationEventBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required to update an event.",
  }
);

export const applicationEventUpcomingQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(14).default(2),
});
