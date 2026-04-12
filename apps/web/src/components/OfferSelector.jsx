export function OfferSelector({ offers = [], selectedOfferIds = [], onSelectChange, onCompareClick }) {
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
    <div className="stack-sm">
      <div className="offers-selector-head">
        <h3>
          Selected ({selectedOfferIds.length} of {offers.length})
        </h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="btn btn-subtle"
        >
          {selectedOfferIds.length === offers.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      {selectedOffers.length > 0 && (
        <>
          <div className="stack-sm">
            {selectedOffers.map((offer) => (
              <div
                key={offer.id}
                className="offers-selected-item"
              >
                <div>
                  <p className="offers-selected-company">{offer.companyName}</p>
                  <p className="muted-text offers-selected-role">{offer.positionTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOffer(offer.id)}
                  className="btn btn-subtle offers-remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onCompareClick?.(selectedOfferIds)}
            disabled={selectedOfferIds.length < 2}
            className="btn btn-primary offers-compare-btn"
          >
            Compare {selectedOfferIds.length} Offers
          </button>
        </>
      )}

      {selectedOffers.length === 0 && (
        <p className="muted-text offers-selector-empty">
          Select offers from the table above to compare
        </p>
      )}
    </div>
  );
}
