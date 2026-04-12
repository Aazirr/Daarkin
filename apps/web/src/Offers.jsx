import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { fetchOffers, setAuthToken as setOffersAuthToken } from "./services/offers-api.js";
import { OfferComparisonTable } from "./components/OfferComparisonTable.jsx";
import { OfferSelector } from "./components/OfferSelector.jsx";

export default function Offers() {
  const { user, token } = useAuth();
  const [offers, setOffers] = useState([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth token when available
  useEffect(() => {
    if (token) {
      setOffersAuthToken(token);
    }
  }, [token]);

  // Fetch offers
  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOffers();
        setOffers(data.offers || []);
        console.info("[Offers] Loaded", { count: data.offers?.length || 0 });
      } catch (err) {
        setError(err.message || "Failed to load offers");
        console.error("[Offers] Error loading offers:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      loadOffers();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 mb-4">
            <div className="w-10 h-10 border-4 border-slate/20 border-t-slate rounded-full animate-spin"></div>
          </div>
          <p className="text-slate font-medium">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red/10 border border-red/20 rounded text-red">
        <p className="font-medium">Error loading offers</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate mb-2">Offer Comparison</h1>
        <p className="text-slate/60">
          Compare your offers side-by-side to find the best opportunity for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate/10 p-4">
            <h2 className="font-semibold text-slate mb-4">Your Offers</h2>
            <OfferComparisonTable
              offers={offers}
              selectedOfferIds={selectedOfferIds}
              onSelectChange={setSelectedOfferIds}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate/10 p-4 h-fit sticky top-6">
          <h2 className="font-semibold text-slate mb-4">Compare Offers</h2>
          <OfferSelector
            offers={offers}
            selectedOfferIds={selectedOfferIds}
            onSelectChange={setSelectedOfferIds}
            onCompareClick={(ids) => {
              console.info("[Offers] Comparing", { count: ids.length, ids });
            }}
          />
        </div>
      </div>

      {offers.length === 0 && (
        <div className="text-center py-12 bg-slate/5 rounded-lg">
          <p className="text-slate/60">No offers yet</p>
          <p className="text-sm text-slate/40 mt-2">
            Update your application status to "offer" to see it here
          </p>
        </div>
      )}
    </div>
  );
}
