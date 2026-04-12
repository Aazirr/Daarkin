import { scoringWeightsUpdateSchema } from "../schemas/scoring-weights.schema.js";
import {
  getScoringWeights as getScoringWeightsFromDb,
  updateScoringWeights as updateScoringWeightsInDb,
  DEFAULT_WEIGHTS,
} from "../repositories/scoring-weights.repository.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("scoring-weights-service");

export function validateUpdatePayload(body) {
  return scoringWeightsUpdateSchema.safeParse(body);
}

export async function getWeights(userId) {
  logger.info("Fetching scoring weights from database", { userId });
  const weights = await getScoringWeightsFromDb(userId);
  return weights || DEFAULT_WEIGHTS;
}

export async function updateWeights(userId, body) {
  logger.info("Updating scoring weights in database", { userId });
  return updateScoringWeightsInDb(userId, body);
}
