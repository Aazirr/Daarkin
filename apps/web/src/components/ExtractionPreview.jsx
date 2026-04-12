import "./ExtractionPreview.css";

/**
 * Confidence badge component - shows the extraction confidence level
 */
function ConfidenceBadge({ confidence, label }) {
  let level = "low";
  let color = "#ef4444"; // red

  if (confidence >= 80) {
    level = "high";
    color = "#22c55e"; // green
  } else if (confidence >= 60) {
    level = "medium";
    color = "#eab308"; // yellow
  }

  return (
    <span className="confidence-badge" style={{ borderColor: color }}>
      <span className="confidence-dot" style={{ backgroundColor: color }}></span>
      {level.charAt(0).toUpperCase() + level.slice(1)} ({confidence}%)
    </span>
  );
}

/**
 * Extraction Preview Modal
 * Shows extracted job data from URL with confidence levels
 * Allows user to review, edit, and confirm the data
 */
export function ExtractionPreview({ extracted, loading, onConfirm, onCancel, onFieldChange }) {
  if (!extracted) {
    return null;
  }

  const { companyName = "", positionTitle = "", location = "", description = "", confidence = {}, sourceUrl = "", overallConfidence = 0 } = extracted;

  const fields = [
    {
      key: "companyName",
      label: "Company Name",
      value: companyName,
      confidenceKey: "companyName",
    },
    {
      key: "positionTitle",
      label: "Position Title",
      value: positionTitle,
      confidenceKey: "positionTitle",
    },
    {
      key: "location",
      label: "Location",
      value: location,
      confidenceKey: "location",
    },
  ];

  return (
    <div className="extraction-preview-scrim" role="presentation" onClick={onCancel}>
      <div
        className="extraction-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Review extracted job data"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="extraction-preview-header">
          <div>
            <h3>Smart URL Extraction</h3>
            <p className="extraction-preview-url">{sourceUrl}</p>
          </div>
          <button type="button" className="btn btn-subtle" onClick={onCancel} disabled={loading}>
            ✕
          </button>
        </div>

        {/* Overall Confidence */}
        <div className="extraction-preview-confidence-bar">
          <div className="confidence-label">
            <span>Extraction Confidence</span>
            <span className="overall-confidence">{overallConfidence}%</span>
          </div>
          <div className="confidence-bar-track">
            <div className="confidence-bar-fill" style={{ width: `${overallConfidence}%` }}></div>
          </div>
        </div>

        {/* Field List */}
        <div className="extraction-preview-fields">
          {fields.map((field) => (
            <div key={field.key} className="extraction-field">
              <div className="field-header">
                <label htmlFor={`extraction-${field.key}`} className="field-label">
                  {field.label}
                </label>
                <ConfidenceBadge
                  confidence={confidence[field.confidenceKey] || 0}
                  label={field.label}
                />
              </div>
              <input
                id={`extraction-${field.key}`}
                type="text"
                className="input extraction-field-input"
                value={field.value}
                onChange={(event) => onFieldChange(field.key, event.target.value)}
                disabled={loading}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            </div>
          ))}

          {description && (
            <div className="extraction-field">
              <label htmlFor="extraction-description" className="field-label">
                Description (Preview)
              </label>
              <div className="extraction-description-preview">
                {description.substring(0, 150)}
                {description.length > 150 ? "..." : ""}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="extraction-preview-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : "Auto-fill Form"}
          </button>
        </div>
      </div>
    </div>
  );
}
