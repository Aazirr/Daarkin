import {
  scoringWeightsUpdateSchema,
} from "../schemas/scoring-weights.schema.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("scoring-weights-service");

// Mock repository (will be replaced with actual DB calls in Phase 7B)
const weightsStore = new Map();

const DEFAULT_WEIGHTS = {
  weight_base_salary: 0.35,
  weight_bonus: 0.15,
  weight_equity: 0.20,
  weight_benefits: 0.10,
  weight_remote: 0.10,
  weight_career_growth: 0.10,
};

export function validateUpdatePayload(body) {
  return scoringWeightsUpdateSchema.safeParse(body);
}

function normalizeCamelToSnake(payload) {
  const normalized = {};
  if (payload.weightBaseSalary !== undefined) normalized.weight_base_salary = payload.weightBaseSalary;
  if (payload.weightBonus !== undefined) normalized.weight_bonus = payload.weightBonus;
  if (payload.weightEquity !== undefined) normalized.weight_equity = payload.weightEquity;
  if (payload.weightBenefits !== undefined) normalized.weight_benefits = payload.weightBenefits;
  if (payload.weightRemote !== undefined) normalized.weight_remote = payload.weightRemote;
  if (payload.weightCareerGrowth !== undefined) normalized.weight_career_growth = payload.weightCareerGrowth;
  return normalized;
}

export async function getWeights(userId) {
  logger.info("Getting scoring weights", { userId });
  // In production: SELECT FROM user_scoring_weights WHERE user_id = $1
  // If not found, return defaults
  return weightsStore.get(userId) || {
    user_id: userId,
    ...DEFAULT_WEIGHTS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function updateWeights(userId, body) {
  logger.info("Updating scoring weights", { userId });
  const normalized = normalizeCamelToSnake(body);
  
  // Get existing or use defaults
  const existing = weightsStore.get(userId) || {
    id: `weights-${Date.now()}`,
    user_id: userId,
    ...DEFAULT_WEIGHTS,
    created_at: new Date().toISOString(),
  };

  const updated = {
    ...existing,
    ...normalized,
    updated_at: new Date().toISOString(),
  };

  weightsStore.set(userId, updated);
  return updated;
}
