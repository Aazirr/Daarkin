import { APPLICATION_STATUSES } from "@jat/shared";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  applicationIdSchema,
} from "../schemas/application.schema.js";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from "../repositories/applications.repository.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("applications-service");

function normalizeOptionalText(value) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = typeof value === "string" ? value.trim() : value;
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalDate(value) {
  if (value === undefined) {
    return undefined;
  }

  return value === "" ? null : value;
}

function normalizeCreatePayload(payload) {
  return {
    companyName: payload.companyName.trim(),
    positionTitle: payload.positionTitle.trim(),
    location: normalizeOptionalText(payload.location),
    applicationUrl: normalizeOptionalText(payload.applicationUrl),
    status: payload.status,
    appliedAt: normalizeOptionalDate(payload.appliedAt),
  };
}

function normalizeUpdatePayload(payload) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(payload, "companyName")) {
    normalized.companyName = payload.companyName.trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, "positionTitle")) {
    normalized.positionTitle = payload.positionTitle.trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, "location")) {
    normalized.location = normalizeOptionalText(payload.location);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "applicationUrl")) {
    normalized.applicationUrl = normalizeOptionalText(payload.applicationUrl);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    normalized.status = payload.status;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "appliedAt")) {
    normalized.appliedAt = normalizeOptionalDate(payload.appliedAt);
  }

  return normalized;
}

export function validateApplicationId(params) {
  return applicationIdSchema.safeParse(params);
}

export function validateCreatePayload(body) {
  return applicationCreateSchema.safeParse(body);
}

export function validateUpdatePayload(body) {
  return applicationUpdateSchema.safeParse(body);
}

export async function getApplications() {
  logger.info("Loading applications from repository");
  return listApplications();
}

export async function getApplication(id) {
  logger.info("Loading application from repository", { id });
  return getApplicationById(id);
}

export async function createNewApplication(body) {
  logger.info("Normalizing create payload", {
    companyName: body.companyName,
    positionTitle: body.positionTitle,
  });
  return createApplication(normalizeCreatePayload(body));
}

export async function updateExistingApplication(id, body) {
  logger.info("Normalizing update payload", { id, fields: Object.keys(body) });
  return updateApplication(id, normalizeUpdatePayload(body));
}

export async function removeApplication(id) {
  logger.info("Removing application from repository", { id });
  return deleteApplication(id);
}
