import { useState, useEffect } from "react";
import { updateScoringWeights } from "../services/offers-api.js";

export function ScoringWeightsEditor({ weights, onClose, onUpdate }) {
  const [formWeights, setFormWeights] = useState(weights || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Define weight fields with labels and descriptions
  const weightFields = [
    {
      key: "baseSalaryWeight",
      label: "Base Salary",
      description: "Annual base compensation",
      defaultValue: 0.35,
    },
    {
      key: "bonusSalaryWeight",
      label: "Bonus & Commission",
      description: "Variable annual compensation",
      defaultValue: 0.15,
    },
    {
      key: "stockEquityWeight",
      label: "Stock & Equity",
      description: "Long-term equity compensation",
      defaultValue: 0.2,
    },
    {
      key: "benefitsWeight",
      label: "Benefits",
      description: "Health, retirement, and other benefits",
      defaultValue: 0.1,
    },
    {
      key: "remoteWeight",
      label: "Remote & Flexibility",
      description: "Work-from-home and schedule flexibility",
      defaultValue: 0.1,
    },
    {
      key: "growthWeight",
      label: "Growth & Learning",
      description: "Career development opportunities",
      defaultValue: 0.1,
    },
  ];

  // Calculate total to show progress
  const total = weightFields.reduce((sum, field) => sum + (Number(formWeights[field.key]) || 0), 0);

  const handleWeightChange = (key, value) => {
    const numValue = Math.min(1, Math.max(0, Number(value) || 0));
    setFormWeights((prev) => ({
      ...prev,
      [key]: numValue,
    }));
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Filter to only include non-default weights for the update
      const changedWeights = {};
      const originalWeights = weights || {};

      weightFields.forEach((field) => {
        const currentValue = Number(formWeights[field.key]) || 0;
        const originalValue = Number(originalWeights[field.key]) || field.defaultValue;

        if (currentValue !== originalValue) {
          changedWeights[field.key] = currentValue;
        }
      });

      if (Object.keys(changedWeights).length === 0) {
        // No changes, just close
        onClose?.();
        return;
      }

      const response = await updateScoringWeights(changedWeights);
      
      if (response?.weights) {
        onUpdate?.(response.weights);
        onClose?.();
      }
    } catch (err) {
      setError(err.message || "Failed to update scoring weights");
      console.error("[ScoringWeightsEditor] Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const resetWeights = {};
    weightFields.forEach((field) => {
      resetWeights[field.key] = field.defaultValue;
    });
    setFormWeights(resetWeights);
    setError(null);
  };

  return (
    <div className="scoring-weights-modal-scrim" onClick={onClose}>
      <div className="scoring-weights-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>Scoring Preferences</h2>
          <p className="muted-text">Adjust how we calculate offer scores</p>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: "var(--space-3)" }}>
            <p>{error}</p>
          </div>
        )}

        <div className="scoring-weights-form">
          {weightFields.map((field) => (
            <div key={field.key} className="weight-field">
              <div className="weight-field-label">
                <label htmlFor={field.key}>{field.label}</label>
                <p className="muted-text">{field.description}</p>
              </div>
              <div className="weight-field-input">
                <div className="weight-input-group">
                  <input
                    id={field.key}
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={Number(formWeights[field.key]) || 0}
                    onChange={(e) => handleWeightChange(field.key, e.target.value)}
                    disabled={saving}
                    className="weight-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={(Number(formWeights[field.key]) || 0).toFixed(2)}
                    onChange={(e) => handleWeightChange(field.key, e.target.value)}
                    disabled={saving}
                    className="weight-number"
                  />
                  <span className="weight-percent">{Math.round((Number(formWeights[field.key]) || 0) * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="weight-total-bar">
          <div className="weight-total-label">
            <span>Total Weight</span>
            <span className={total === 1 ? "total-ok" : "total-warning"}>{Math.round(total * 100)}%</span>
          </div>
          <div className="weight-total-progress">
            <div className="progress-bar" style={{ width: `${Math.min(total * 100, 100)}%` }}></div>
          </div>
          {total !== 1 && (
            <p className="muted-text weight-total-hint">
              Weights should sum to 100% for balanced scoring
            </p>
          )}
        </div>

        <div className="row-actions">
          <button
            type="button"
            className="btn btn-subtle"
            onClick={handleReset}
            disabled={saving}
          >
            Reset to Default
          </button>
          <div>
            <button
              type="button"
              className="btn btn-subtle"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
