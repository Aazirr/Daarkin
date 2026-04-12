import { z } from "zod";

const weightSchema = z
  .number()
  .min(0, "Weight must be >= 0.")
  .max(1, "Weight must be <= 1.")
  .default(0.1);

export const scoringWeightsUpdateSchema = z.object({
  weightBaseSalary: weightSchema.optional(),
  weightBonus: weightSchema.optional(),
  weightEquity: weightSchema.optional(),
  weightBenefits: weightSchema.optional(),
  weightRemote: weightSchema.optional(),
  weightCareerGrowth: weightSchema.optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one weight is required to update scoring preferences.",
  }
);

export const scoringWeightsGetSchema = z.object({});
