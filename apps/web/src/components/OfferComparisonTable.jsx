import { useState } from "react";

export function OfferComparisonTable({ offers, selectedOfferIds = [], onSelectChange }) {
  const [sortBy, setSortBy] = useState("score");
  const [sortOrder, setSortOrder] = useState("desc");

  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate/60">No offers available</p>
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
      className="text-left text-sm font-medium text-slate/70 hover:text-slate cursor-pointer py-3 px-4 border-b border-slate/10"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortBy === column && (
          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto border border-slate/10 rounded-lg">
      <table className="w-full">
        <thead className="bg-slate/5">
          <tr>
            <th className="w-10">
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
                className="rounded w-4 h-4 text-slate border-slate/30"
              />
            </th>
            <SortHeader column="companyName" label="Company" />
            <SortHeader column="positionTitle" label="Position" />
            <SortHeader column="baseSalary" label="Base Salary" />
            <SortHeader column="bonusSalary" label="Bonus" />
            <th className="text-left text-sm font-medium text-slate/70 py-3 px-4 border-b border-slate/10">Stock / Equity</th>
            <th className="text-left text-sm font-medium text-slate/70 py-3 px-4 border-b border-slate/10">Location</th>
            <SortHeader column="score" label="Score" />
          </tr>
        </thead>
        <tbody>
          {sortedOffers.map((offer, index) => (
            <tr 
              key={offer.id} 
              className={`${
                index % 2 === 0 ? "bg-white" : "bg-slate/2"
              } hover:bg-slate/5 border-b border-slate/10 transition-colors`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedOfferIds.includes(offer.id)}
                  onChange={() => handleSelectChange(offer.id)}
                  className="rounded w-4 h-4 text-slate border-slate/30"
                />
              </td>
              <td className="px-4 py-3 text-sm font-medium text-slate">{offer.companyName || "N/A"}</td>
              <td className="px-4 py-3 text-sm text-slate/80">{offer.positionTitle || "N/A"}</td>
              <td className="px-4 py-3 text-sm text-slate/80 font-mono">
                ${(offer.compensation?.baseSalary || 0).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-slate/80 font-mono">
                ${(offer.compensation?.bonusSalary || 0).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-slate/80">
                {offer.compensation?.stockEquity || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate/80">
                <span className="inline-block px-2 py-1 rounded bg-slate/10 text-xs">
                  {offer.compensation?.locationType === "remote" ? "🌍 Remote" : offer.compensation?.locationType || "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm font-medium">
                <span className={`inline-block px-2 py-1 rounded font-mono ${
                  offer.score >= 85 ? "bg-green/20 text-green/80" :
                  offer.score >= 70 ? "bg-yellow/20 text-yellow/80" :
                  "bg-slate/20 text-slate/80"
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
