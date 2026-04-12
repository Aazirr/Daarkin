import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("scoring-weights-repository");

const DEFAULT_WEIGHTS = {
  baseSalaryWeight: 0.35,
  bonusSalaryWeight: 0.15,
  stockEquityWeight: 0.2,
  benefitsWeight: 0.1,
  remoteWeight: 0.1,
  growthWeight: 0.1,
};

function mapScoringWeightsRow(row) {
  if (!row) return DEFAULT_WEIGHTS;
  return {
    baseSalaryWeight: Number(row.base_salary_weight) || DEFAULT_WEIGHTS.baseSalaryWeight,
    bonusSalaryWeight: Number(row.bonus_salary_weight) || DEFAULT_WEIGHTS.bonusSalaryWeight,
    stockEquityWeight: Number(row.stock_equity_weight) || DEFAULT_WEIGHTS.stockEquityWeight,
    benefitsWeight: Number(row.benefits_weight) || DEFAULT_WEIGHTS.benefitsWeight,
    remoteWeight: Number(row.remote_weight) || DEFAULT_WEIGHTS.remoteWeight,
    growthWeight: Number(row.growth_weight) || DEFAULT_WEIGHTS.growthWeight,
  };
}

export async function getScoringWeights(userId) {
  const query = `
    SELECT *
    FROM user_scoring_weights
    WHERE user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  const row = result.rows[0];
  return mapScoringWeightsRow(row);
}

export async function updateScoringWeights(userId, payload) {
  // Try to insert, if user doesn't have weights yet
  const insertQuery = `
    INSERT INTO user_scoring_weights (
      user_id,
      base_salary_weight,
      bonus_salary_weight,
      stock_equity_weight,
      benefits_weight,
      remote_weight,
      growth_weight
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id) DO UPDATE SET
      base_salary_weight = COALESCE(EXCLUDED.base_salary_weight, user_scoring_weights.base_salary_weight),
      bonus_salary_weight = COALESCE(EXCLUDED.bonus_salary_weight, user_scoring_weights.bonus_salary_weight),
      stock_equity_weight = COALESCE(EXCLUDED.stock_equity_weight, user_scoring_weights.stock_equity_weight),
      benefits_weight = COALESCE(EXCLUDED.benefits_weight, user_scoring_weights.benefits_weight),
      remote_weight = COALESCE(EXCLUDED.remote_weight, user_scoring_weights.remote_weight),
      growth_weight = COALESCE(EXCLUDED.growth_weight, user_scoring_weights.growth_weight)
    RETURNING *
  `;

  const result = await pool.query(insertQuery, [
    userId,
    Object.prototype.hasOwnProperty.call(payload, "baseSalaryWeight")
      ? payload.baseSalaryWeight
      : DEFAULT_WEIGHTS.baseSalaryWeight,
    Object.prototype.hasOwnProperty.call(payload, "bonusSalaryWeight")
      ? payload.bonusSalaryWeight
      : DEFAULT_WEIGHTS.bonusSalaryWeight,
    Object.prototype.hasOwnProperty.call(payload, "stockEquityWeight")
      ? payload.stockEquityWeight
      : DEFAULT_WEIGHTS.stockEquityWeight,
    Object.prototype.hasOwnProperty.call(payload, "benefitsWeight")
      ? payload.benefitsWeight
      : DEFAULT_WEIGHTS.benefitsWeight,
    Object.prototype.hasOwnProperty.call(payload, "remoteWeight")
      ? payload.remoteWeight
      : DEFAULT_WEIGHTS.remoteWeight,
    Object.prototype.hasOwnProperty.call(payload, "growthWeight")
      ? payload.growthWeight
      : DEFAULT_WEIGHTS.growthWeight,
  ]);

  return mapScoringWeightsRow(result.rows[0]);
}

export { DEFAULT_WEIGHTS };
