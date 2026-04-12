import { useState } from "react";

export function OfferComparisonTable({ offers, selectedOfferIds = [], onSelectChange }) {
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState("desc");

  if (!offers || offers.length === 0) {
    return (
      <div className="offers-empty">
        <p className="muted-text">No offers available</p>
      </div>
    );
  }

  const sortedOffers = [...offers].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === "score") {
      aValue = a.score || 0;
      bValue = b.score || 0;
    } else if (sortBy === "baseSalary") {
      aValue = a.compensation?.baseSalary || 0;
      bValue = b.compensation?.baseSalary || 0;
    } else if (sortBy === "totalCompensation") {
      aValue = (a.compensation?.baseSalary || 0) + (a.compensation?.bonusSalary || 0);
      bValue = (b.compensation?.baseSalary || 0) + (b.compensation?.bonusSalary || 0);
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleSelectChange = (offerId) => {
    if (onSelectChange) {
      const newSelected = selectedOfferIds.includes(offerId)
        ? selectedOfferIds.filter((id) => id !== offerId)
        : [...selectedOfferIds, offerId];
      onSelectChange(newSelected);
    }
  };

  const SortHeader = ({ column, label }) => (
    <th
      onClick={() => handleSort(column)}
      className="offers-sort-header"
    >
      <div className="offers-sort-inner">
        {label}
        {sortBy === column && (
          <span className="offers-sort-arrow">{sortOrder === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="offers-table-wrap">
      <table className="offers-table mono-text">
        <thead>
          <tr>
            <th className="offers-check-col">
              <input
                type="checkbox"
                checked={selectedOfferIds.length === offers.length && offers.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectChange?.(offers.map((o) => o.id));
                  } else {
                    onSelectChange?.([]);
                  }
                }}
                className="offers-checkbox"
              />
            </th>
            <SortHeader column="companyName" label="Company" />
            <SortHeader column="positionTitle" label="Position" />
            <SortHeader column="baseSalary" label="Base Salary" />
            <SortHeader column="bonusSalary" label="Bonus" />
            <th className="offers-static-header">Stock / Equity</th>
            <th className="offers-static-header">Location</th>
            <SortHeader column="score" label="Score" />
          </tr>
        </thead>
        <tbody>
          {sortedOffers.map((offer, index) => (
            <tr
              key={offer.id} 
              className={`offers-row ${index % 2 === 0 ? "offers-row-even" : "offers-row-odd"}`}
            >
              <td className="offers-cell">
                <input
                  type="checkbox"
                  checked={selectedOfferIds.includes(offer.id)}
                  onChange={() => handleSelectChange(offer.id)}
                  className="offers-checkbox"
                />
              </td>
              <td className="offers-cell offers-company-cell">
                {offer.companyName || "N/A"}
              </td>
              <td className="offers-cell offers-muted-cell">{offer.positionTitle || "N/A"}</td>
              <td className="offers-cell offers-muted-cell">
                ${(offer.compensation?.baseSalary || 0).toLocaleString()}
              </td>
              <td className="offers-cell offers-muted-cell">
                ${(offer.compensation?.bonusSalary || 0).toLocaleString()}
              </td>
              <td className="offers-cell offers-muted-cell">
                {offer.compensation?.stockEquity || "—"}
              </td>
              <td className="offers-cell offers-muted-cell">
                <span className="offers-location-pill">
                  {offer.compensation?.locationType === "remote" ? "🌍 Remote" : offer.compensation?.locationType || "—"}
                </span>
              </td>
              <td className="offers-cell">
                <span className={`offers-score-badge ${
                  offer.score >= 85 ? "offers-score-high" :
                  offer.score >= 70 ? "offers-score-mid" :
                  "offers-score-low"
                }`}>
                  {offer.score?.toFixed(0) || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
