import {
  applicationIdSchema,
  compensationCreateSchema,
  compensationUpdateSchema,
} from "../schemas/compensation.schema.js";
import {
  getCompensationByApplicationId,
  createCompensation as createCompensationInDb,
  updateCompensation as updateCompensationInDb,
  deleteCompensation as deleteCompensationFromDb,
} from "../repositories/compensation.repository.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("compensation-service");

export function validateApplicationId(params) {
  return applicationIdSchema.safeParse(params);
}

export function validateCreatePayload(body) {
  return compensationCreateSchema.safeParse(body);
}

export function validateUpdatePayload(body) {
  return compensationUpdateSchema.safeParse(body);
}

export async function getCompensation(applicationId, userId) {
  logger.info("Fetching compensation from database", { applicationId, userId });
  const compensation = await getCompensationByApplicationId(applicationId, userId);
  return compensation || null;
}

export async function createCompensation(applicationId, userId, body) {
  logger.info("Creating compensation in database", { applicationId, userId });
  return createCompensationInDb(applicationId, userId, body);
}

export async function updateCompensation(applicationId, userId, body) {
  logger.info("Updating compensation in database", { applicationId, userId });
  return updateCompensationInDb(applicationId, userId, body);
}

export async function deleteCompensation(applicationId, userId) {
  logger.info("Deleting compensation from database", { applicationId, userId });
  return deleteCompensationFromDb(applicationId, userId);
}
