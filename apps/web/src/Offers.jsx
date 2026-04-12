import { useEffect, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { fetchOffers, setAuthToken as setOffersAuthToken, fetchScoringWeights } from "./services/offers-api.js";
import { OfferComparisonTable } from "./components/OfferComparisonTable.jsx";
import { OfferSelector } from "./components/OfferSelector.jsx";
import { ScoringWeightsEditor } from "./components/ScoringWeightsEditor.jsx";
import { OfferComparison } from "./components/OfferComparison.jsx";

export default function Offers({ onBack, onOpenBoard }) {
  const { user, token } = useAuth();
  const [offers, setOffers] = useState([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState([]);
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "1");
  const [showWeightsEditor, setShowWeightsEditor] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  // Set auth token when available
  useEffect(() => {
    if (token) {
      setOffersAuthToken(token);
    }
  }, [token]);

  // Fetch offers and weights
  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchOffers();
        setOffers(data.offers || []);
        setWeights(data.weights || {});
        console.info("[Offers] Loaded", { count: data.offers?.length || 0, weights: data.weights });
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

  const handleWeightsUpdate = async (updatedWeights) => {
    try {
      // Update local weights
      setWeights(updatedWeights);
      
      // Re-fetch offers with new weights to get updated scores
      const data = await fetchOffers();
      setOffers(data.offers || []);
      console.info("[Offers] Weights updated, offers recalculated", { weights: updatedWeights });
    } catch (err) {
      console.error("[Offers] Error updating weights:", err);
    }
  };

  // Find the top offer (highest score)
  const topOfferId = offers.length > 0
    ? offers.reduce((max, offer) => {
        if (!max || (offer.score !== null && (max.score === null || offer.score > max.score))) {
          return offer;
        }
        return max;
      }, null)?.id
    : null;

  if (loading) {
    return (
      <div className="app-content">
        <div className="panel offers-loading">
          <div className="offers-spinner-wrap">
            <div className="offers-spinner"></div>
          </div>
          <p>Loading offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-content">
        <div className="alert alert-error">
          <p><strong>Error loading offers</strong></p>
          <p className="muted-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed((prev) => !prev)}>
          {sidebarCollapsed ? "»" : "«"}
        </button>

        <nav className="sidebar-nav">
          <button type="button" className="nav-item" title="Dashboard" onClick={() => onBack?.()}>
            ▦ {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button type="button" className="nav-item" title="Board" onClick={() => onOpenBoard?.()}>
            ☰ {!sidebarCollapsed && <span>Board</span>}
          </button>
          <button type="button" className="nav-item active" title="Offers">
            ✦ {!sidebarCollapsed && <span>Offers</span>}
          </button>
        </nav>
      </aside>

      <main className="app-content">
        <div className="app-header">
          <div>
            <h1 className="app-title company-display">Offer Comparison</h1>
            <p className="app-subtitle">Compare your active offers side-by-side.</p>
          </div>
          <div className="app-user-actions">
            <button
              type="button"
              className="btn btn-subtle"
              onClick={() => setShowWeightsEditor(true)}
              title="Adjust scoring weights"
            >
              ⚙ Settings
            </button>
            <button type="button" className="btn btn-subtle" onClick={() => onBack?.()}>
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="stack-sm">
          <div>
            <p className="muted-text">
              Compare your offers side-by-side to find the best opportunity for you.
            </p>
          </div>

          <div className="offers-main-grid">
            <div>
              <div className="panel">
                <h2>Your Offers</h2>
                <OfferComparisonTable
                  offers={offers}
                  selectedOfferIds={selectedOfferIds}
                  onSelectChange={setSelectedOfferIds}
                  topOfferId={topOfferId}
                />
              </div>
            </div>

            <div className="panel offers-sidebar-panel">
              <h2>Compare Offers</h2>
              <OfferSelector
                offers={offers}
                selectedOfferIds={selectedOfferIds}
                onSelectChange={setSelectedOfferIds}
                onCompareClick={(ids) => {
                  console.info("[Offers] Opening comparison", { count: ids.length, ids });
                  setShowComparison(true);
                }}
              />
            </div>
          </div>

          {offers.length === 0 && (
            <div className="empty-state">
              <p>No offers yet</p>
              <p className="muted-text">
                Update your application status to "offer" to see it here
              </p>
            </div>
          )}
        </div>

        {showWeightsEditor && weights && (
          <ScoringWeightsEditor
            weights={weights}
            onClose={() => setShowWeightsEditor(false)}
            onUpdate={handleWeightsUpdate}
          />
        )}

        {showComparison && selectedOfferIds.length > 0 && (
          <OfferComparison
            offers={offers}
            selectedOfferIds={selectedOfferIds}
            onClose={() => setShowComparison(false)}
          />
        )}
      </main>
    </div>
  );
}
