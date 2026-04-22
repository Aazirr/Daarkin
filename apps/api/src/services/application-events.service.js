import {
  applicationEventApplicationIdSchema,
  applicationEventCreateSchema,
  applicationEventIdSchema,
  applicationEventUpcomingQuerySchema,
  applicationEventUpdateSchema,
} from "../schemas/application-event.schema.js";
import {
  createApplicationEvent,
  deleteApplicationEvent,
  listEventsByApplicationId,
  listUpcomingEvents,
  updateApplicationEvent,
} from "../repositories/application-events.repository.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("application-events-service");

function normalizeOptionalText(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeCreatePayload(payload) {
  return {
    eventType: payload.eventType,
    title: payload.title.trim(),
    startsAt: payload.startsAt,
    endsAt: payload.endsAt || null,
    notes: normalizeOptionalText(payload.notes),
  };
}

function normalizeUpdatePayload(payload) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(payload, "eventType")) {
    normalized.eventType = payload.eventType;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    normalized.title = payload.title.trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, "startsAt")) {
    normalized.startsAt = payload.startsAt;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "endsAt")) {
    normalized.endsAt = payload.endsAt || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "notes")) {
    normalized.notes = normalizeOptionalText(payload.notes);
  }

  return normalized;
}

export function validateApplicationId(params) {
  return applicationEventApplicationIdSchema.safeParse(params);
}

export function validateEventId(params) {
  return applicationEventIdSchema.safeParse(params);
}

export function validateCreatePayload(body) {
  return applicationEventCreateSchema.safeParse(body);
}

export function validateUpdatePayload(body) {
  return applicationEventUpdateSchema.safeParse(body);
}

export function validateUpcomingQuery(query) {
  return applicationEventUpcomingQuerySchema.safeParse(query);
}

export async function getApplicationEvents(applicationId, userId) {
  logger.info("Getting application events", { applicationId, userId });
  return listEventsByApplicationId(applicationId, userId);
}

export async function createNewApplicationEvent(applicationId, userId, body) {
  logger.info("Creating application event", { applicationId, userId });
  return createApplicationEvent(applicationId, userId, normalizeCreatePayload(body));
}

export async function updateExistingApplicationEvent(id, userId, body) {
  logger.info("Updating application event", { id, userId });
  return updateApplicationEvent(id, userId, normalizeUpdatePayload(body));
}

export async function removeApplicationEvent(id, userId) {
  logger.info("Removing application event", { id, userId });
  return deleteApplicationEvent(id, userId);
}

export async function getUpcomingApplicationEvents(userId, query) {
  logger.info("Getting upcoming application events", { userId, query });
  return listUpcomingEvents(userId, query.days);
}
