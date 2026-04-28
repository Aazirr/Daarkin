import { z } from "zod";

export const gmailCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const gmailSyncBodySchema = z.object({
  maxResults: z.number().int().min(1).max(50).optional().default(20),
});
