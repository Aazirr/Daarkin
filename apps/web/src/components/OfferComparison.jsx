import { useMemo } from "react";

export function OfferComparison({ offers, selectedOfferIds, onClose }) {
  const selectedOffers = useMemo(() => {
    return offers.filter((o) => selectedOfferIds.includes(o.id)).slice(0, 2);
  }, [offers, selectedOfferIds]);

  if (selectedOffers.length === 0) {
    return null;
  }

  // Helper to find max values for scaling
  const maxSalary = Math.max(...selectedOffers.map((o) => o.compensation?.baseSalary || 0));
  const maxBonus = Math.max(...selectedOffers.map((o) => o.compensation?.bonusSalary || 0));
  const maxTotal = Math.max(...selectedOffers.map((o) => (o.compensation?.baseSalary || 0) + (o.compensation?.bonusSalary || 0)));
  const maxScore = 100; // Scores are 0-100

  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return "$" + Math.round(amount).toLocaleString();
  };

  const CompensationBars = ({ offer }) => {
    const base = offer.compensation?.baseSalary || 0;
    const bonus = offer.compensation?.bonusSalary || 0;
    const total = base + bonus;

    const basePercent = Math.round((base / maxTotal) * 100);
    const bonusPercent = Math.round((bonus / maxTotal) * 100);

    return (
      <div className="comparison-compensation">
        <div className="comparison-metric">
          <div className="metric-label">
            <span>Base Salary</span>
            <span className="metric-value">{formatCurrency(base)}</span>
          </div>
          <div className="bar-chart">
            <div
              className="bar-segment base-salary"
              style={{ width: `${Math.max(basePercent, 5)}%` }}
              title={`${Math.round((base / maxSalary) * 100)}% of highest base`}
            ></div>
          </div>
        </div>

        <div className="comparison-metric">
          <div className="metric-label">
            <span>Bonus</span>
            <span className="metric-value">{formatCurrency(bonus)}</span>
          </div>
          <div className="bar-chart">
            <div
              className="bar-segment bonus"
              style={{ width: `${Math.max(bonusPercent, 5)}%` }}
              title={`${Math.round((bonus / maxBonus) * 100)}% of highest bonus`}
            ></div>
          </div>
        </div>

        <div className="comparison-metric total">
          <div className="metric-label">
            <span>Total Compensation</span>
            <span className="metric-value">{formatCurrency(total)}</span>
          </div>
          <div className="bar-chart">
            <div className="bar-segment-stacked">
              {base > 0 && (
                <div
                  className="bar-segment base-salary"
                  style={{ flex: base / total }}
                ></div>
              )}
              {bonus > 0 && (
                <div
                  className="bar-segment bonus"
                  style={{ flex: bonus / total }}
                ></div>
              )}
            </div>
          </div>
        </div>

        <div className="comparison-metric">
          <div className="metric-label">
            <span>Stock & Equity</span>
            <span className="metric-value">{offer.compensation?.stockEquity || "—"}</span>
          </div>
        </div>

        <div className="comparison-metric">
          <div className="metric-label">
            <span>Benefits</span>
            <span className="metric-value metric-text">{offer.compensation?.benefits || "Not specified"}</span>
          </div>
        </div>
      </div>
    );
  };

  const ScoreComparison = ({ offer }) => {
    const score = offer.score || 0;
    const scorePercent = Math.round((score / maxScore) * 100);

    return (
      <div className="comparison-score">
        <div className="score-label">
          <span>Offer Score</span>
          <span className={`score-badge ${score >= 85 ? "high" : score >= 70 ? "mid" : "low"}`}>
            {Math.round(score)}/100
          </span>
        </div>
        <div className="score-bar-lg">
          <div
            className={`score-bar-fill ${score >= 85 ? "high" : score >= 70 ? "mid" : "low"}`}
            style={{ width: `${scorePercent}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const DifferenceHighlight = () => {
    if (selectedOffers.length < 2) return null;

    const offer1 = selectedOffers[0];
    const offer2 = selectedOffers[1];

    const salary1 = offer1.compensation?.baseSalary || 0;
    const salary2 = offer2.compensation?.baseSalary || 0;
    const salaryDiff = salary2 - salary1;

    const bonus1 = offer1.compensation?.bonusSalary || 0;
    const bonus2 = offer2.compensation?.bonusSalary || 0;
    const bonusDiff = bonus2 - bonus1;

    const total1 = salary1 + bonus1;
    const total2 = salary2 + bonus2;
    const totalDiff = total2 - total1;

    const score1 = offer1.score || 0;
    const score2 = offer2.score || 0;
    const scoreDiff = score2 - score1;

    return (
      <div className="comparison-difference">
        <h3>Differences</h3>
        <div className="difference-grid">
          <div className="difference-item">
            <span className="difference-label">Base Salary Delta</span>
            <span className={`difference-value ${salaryDiff > 0 ? "positive" : salaryDiff < 0 ? "negative" : ""}`}>
              {salaryDiff > 0 ? "+" : ""}{formatCurrency(salaryDiff)}
            </span>
          </div>
          <div className="difference-item">
            <span className="difference-label">Bonus Delta</span>
            <span className={`difference-value ${bonusDiff > 0 ? "positive" : bonusDiff < 0 ? "negative" : ""}`}>
              {bonusDiff > 0 ? "+" : ""}{formatCurrency(bonusDiff)}
            </span>
          </div>
          <div className="difference-item">
            <span className="difference-label">Total Comp Delta</span>
            <span className={`difference-value ${totalDiff > 0 ? "positive" : totalDiff < 0 ? "negative" : ""}`}>
              {totalDiff > 0 ? "+" : ""}{formatCurrency(totalDiff)}
            </span>
          </div>
          <div className="difference-item">
            <span className="difference-label">Score Delta</span>
            <span className={`difference-value ${scoreDiff > 0 ? "positive" : scoreDiff < 0 ? "negative" : ""}`}>
              {scoreDiff > 0 ? "+" : ""}{scoreDiff.toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="offer-comparison-scrim" onClick={onClose}>
      <div className="offer-comparison-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comparison-header">
          <h2>Offer Comparison</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="comparison-content">
          <div className="comparison-cards">
            {selectedOffers.map((offer, idx) => (
              <div key={offer.id} className={`comparison-card card-${idx + 1}`}>
                <div className="card-header">
                  <h3>{offer.companyName}</h3>
                  <p className="card-subtitle">{offer.positionTitle}</p>
                  <p className="card-location">
                    {offer.compensation?.locationType === "remote"
                      ? "🌍 Remote"
                      : offer.compensation?.locationType || "On-site"}
                  </p>
                </div>

                <div className="card-body">
                  <CompensationBars offer={offer} />
                  <div className="card-divider"></div>
                  <ScoreComparison offer={offer} />
                </div>
              </div>
            ))}
          </div>

          {selectedOffers.length === 2 && <DifferenceHighlight />}
        </div>

        <div className="comparison-footer">
          <button type="button" className="btn btn-subtle" onClick={onClose}>
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
