import { listApplications, getApplicationById } from "../repositories/applications.repository.js";
import { getCompensationByApplicationId } from "../repositories/compensation.repository.js";
import { getScoringWeights } from "../repositories/scoring-weights.repository.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("offers-service");

// Helper function to calculate offer score based on compensation and user weights
export async function calculateOfferScore(compensation, weights) {
  if (!compensation) {
    return null;
  }

  // Normalize compensation values to 0-100 scale (for comparison)
  const baseSalaryScore = compensation.baseSalary ? Math.min((compensation.baseSalary / 200000) * 100, 100) : 0;
  const bonusScore = compensation.bonusSalary ? Math.min((compensation.bonusSalary / 100000) * 100, 100) : 0;
  const equityScore = compensation.stockEquity ? 90 : 0; // Presence-based scoring for equity
  const benefitsScore = compensation.benefits ? 85 : 0; // Presence-based scoring for benefits
  const remoteScore =
    compensation.locationType === "remote" ? 100 : compensation.locationType === "hybrid" ? 70 : 40;
  const growthScore = 50; // Placeholder for future role-based scoring

  // Apply user weights to calculate total score
  const totalScore =
    baseSalaryScore * weights.baseSalaryWeight +
    bonusScore * weights.bonusSalaryWeight +
    equityScore * weights.stockEquityWeight +
    benefitsScore * weights.benefitsWeight +
    remoteScore * weights.remoteWeight +
    growthScore * weights.growthWeight;

  return Math.round(totalScore);
}

export async function listOffers(userId) {
  logger.info("Listing offers", { userId });

  // Fetch all applications with offer status
  const query = {
    status: "offer",
    sortBy: "updatedAt",
    sortOrder: "desc",
    page: 1,
    pageSize: 100, // Get all offers
  };

  const result = await listApplications(userId, query);
  const applications = result.applications || [];

  // Fetch user's scoring weights
  const weights = await getScoringWeights(userId);

  // Enrich each application with compensation and calculated score
  const offersWithScores = await Promise.all(
    applications.map(async (app) => {
      const compensation = await getCompensationByApplicationId(app.id, userId);
      const score = await calculateOfferScore(compensation, weights);

      return {
        ...app,
        compensation,
        score,
      };
    })
  );

  // Sort by score descending (highest score first)
  const sortedOffers = offersWithScores.sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  return {
    offers: sortedOffers,
    count: sortedOffers.length,
    weights,
  };
}

export async function getOffer(offerId, userId) {
  logger.info("Getting offer", { offerId, userId });

  const application = await getApplicationById(offerId, userId);

  if (!application || application.status !== "offer") {
    logger.error("Offer not found or not an offer status", { offerId, userId });
    return null;
  }

  const compensation = await getCompensationByApplicationId(offerId, userId);
  const weights = await getScoringWeights(userId);
  const score = await calculateOfferScore(compensation, weights);

  const offerWithScore = {
    ...application,
    compensation,
    score,
  };

  return {
    offer: offerWithScore,
    weights,
  };
}
