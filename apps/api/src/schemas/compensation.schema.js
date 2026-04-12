import { z } from "zod";

export const applicationIdSchema = z.object({
  id: z.string().uuid(),
});

const compensationFieldsSchema = z.object({
  baseSalary: z
    .number()
    .positive("Base salary must be a positive number.")
    .optional()
    .nullable(),
  bonusSalary: z
    .number()
    .nonnegative("Bonus salary must be non-negative.")
    .optional()
    .nullable(),
  signingBonus: z
    .number()
    .nonnegative("Signing bonus must be non-negative.")
    .optional()
    .nullable(),
  stockEquity: z
    .string()
    .trim()
    .max(500, "Stock equity description cannot exceed 500 characters.")
    .optional()
    .nullable(),
  benefits: z
    .string()
    .trim()
    .max(1000, "Benefits description cannot exceed 1000 characters.")
    .optional()
    .nullable(),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code (e.g., USD, EUR).")
    .default("USD"),
  payCadence: z
    .enum(["annual", "monthly", "bi-weekly", "weekly"], {
      errorMap: () => ({ message: "Invalid pay cadence. Must be: annual, monthly, bi-weekly, or weekly." }),
    })
    .default("annual"),
  locationType: z
    .enum(["remote", "hybrid", "on-site"], {
      errorMap: () => ({ message: "Invalid location type. Must be: remote, hybrid, or on-site." }),
    })
    .optional()
    .nullable(),
  startDate: z
    .string()
    .date("Start date must be a valid ISO date (YYYY-MM-DD).")
    .optional()
    .nullable(),
});

export const compensationCreateSchema = compensationFieldsSchema.refine(
  (value) => {
    // At least one compensation field should be provided
    return (
      value.baseSalary !== null &&
      value.bonusSalary !== null &&
      value.signingBonus !== null &&
      value.stockEquity !== null &&
      value.benefits !== null &&
      value.locationType !== null &&
      value.startDate !== null
    ) || Object.values(value).some(v => v !== null && v !== undefined);
  },
  {
    message: "At least one compensation field must be provided.",
  }
);

export const compensationUpdateSchema = compensationFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field is required to update compensation.",
  }
);
