import {
  applicationIdSchema,
  compensationCreateSchema,
  compensationUpdateSchema,
} from "../schemas/compensation.schema.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("compensation-service");

// Mock repository (will be replaced with actual DB calls in Phase 7B)
const compensationStore = new Map();

export function validateApplicationId(params) {
  return applicationIdSchema.safeParse(params);
}

export function validateCreatePayload(body) {
  return compensationCreateSchema.safeParse(body);
}

export function validateUpdatePayload(body) {
  return compensationUpdateSchema.safeParse(body);
}

function normalizeCamelToSnake(payload) {
  const normalized = {};
  if (payload.baseSalary !== undefined) normalized.base_salary = payload.baseSalary;
  if (payload.bonusSalary !== undefined) normalized.bonus_salary = payload.bonusSalary;
  if (payload.signingBonus !== undefined) normalized.signing_bonus = payload.signingBonus;
  if (payload.stockEquity !== undefined) normalized.stock_equity = payload.stockEquity;
  if (payload.benefits !== undefined) normalized.benefits = payload.benefits;
  if (payload.currency !== undefined) normalized.currency = payload.currency;
  if (payload.payCadence !== undefined) normalized.pay_cadence = payload.payCadence;
  if (payload.locationType !== undefined) normalized.location_type = payload.locationType;
  if (payload.startDate !== undefined) normalized.start_date = payload.startDate;
  return normalized;
}

export async function getCompensation(applicationId, userId) {
  logger.info("Getting compensation", { applicationId, userId });
  // In production: SELECT FROM application_compensation WHERE application_id = $1 AND user_id in applications table
  return compensationStore.get(applicationId) || null;
}

export async function createCompensation(applicationId, userId, body) {
  logger.info("Creating compensation", { applicationId, userId });
  const normalized = normalizeCamelToSnake(body);
  const compensation = {
    id: `comp-${Date.now()}`,
    application_id: applicationId,
    user_id: userId,
    ...normalized,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  compensationStore.set(applicationId, compensation);
  return compensation;
}

export async function updateCompensation(applicationId, userId, body) {
  logger.info("Updating compensation", { applicationId, userId });
  const existing = compensationStore.get(applicationId);
  if (!existing) {
    return null;
  }
  const normalized = normalizeCamelToSnake(body);
  const updated = {
    ...existing,
    ...normalized,
    updated_at: new Date().toISOString(),
  };
  compensationStore.set(applicationId, updated);
  return updated;
}

export async function deleteCompensation(applicationId, userId) {
  logger.info("Deleting compensation", { applicationId, userId });
  return compensationStore.delete(applicationId);
}
