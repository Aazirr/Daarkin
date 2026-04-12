import { useState } from "react";

export function OfferSelector({ offers = [], selectedOfferIds = [], onSelectChange, onCompareClick }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOffers = offers.filter((o) => selectedOfferIds.includes(o.id));

  const handleSelectAll = () => {
    if (selectedOfferIds.length === offers.length) {
      onSelectChange?.([]);
    } else {
      onSelectChange?.(offers.map((o) => o.id));
    }
  };

  const handleRemoveOffer = (offerId) => {
    onSelectChange?.(selectedOfferIds.filter((id) => id !== offerId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate">
          Selected ({selectedOfferIds.length} of {offers.length})
        </h3>
        <button
          onClick={handleSelectAll}
          className="text-xs px-2 py-1 rounded bg-slate/10 hover:bg-slate/20 text-slate transition-colors"
        >
          {selectedOfferIds.length === offers.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      {selectedOffers.length > 0 && (
        <>
          <div className="space-y-2">
            {selectedOffers.map((offer) => (
              <div 
                key={offer.id}
                className="flex items-center justify-between p-3 rounded border border-slate/20 bg-slate/5 hover:bg-slate/10 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate text-sm">{offer.companyName}</p>
                  <p className="text-xs text-slate/60">{offer.positionTitle}</p>
                </div>
                <button
                  onClick={() => handleRemoveOffer(offer.id)}
                  className="text-xs px-2 py-1 rounded bg-red/10 hover:bg-red/20 text-red transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => onCompareClick?.(selectedOfferIds)}
            disabled={selectedOfferIds.length < 2}
            className="w-full px-4 py-2 rounded font-medium bg-slate text-cream hover:bg-slate/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Compare {selectedOfferIds.length} Offers
          </button>
        </>
      )}

      {selectedOffers.length === 0 && (
        <p className="text-sm text-slate/60 text-center py-6">
          Select offers from the table above to compare
        </p>
      )}
    </div>
  );
}
