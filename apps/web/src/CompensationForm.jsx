import { useState, useEffect } from "react";
import { createCompensation, updateCompensation, deleteCompensation } from "./services/compensation-api.js";

export function CompensationForm({ applicationId, userId, onSave, onError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, loading, saving, saved, error
  const [compensation, setCompensation] = useState(null);

  const [formData, setFormData] = useState({
    baseSalary: "",
    bonusSalary: "",
    signingBonus: "",
    stockEquity: "",
    benefits: "",
    currency: "USD",
    payCadence: "annual",
    locationType: "on-site",
    startDate: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");

    try {
      // Only send fields that have values
      const payload = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== "" && value !== null) {
          // Convert numeric strings to numbers
          if (["baseSalary", "bonusSalary", "signingBonus"].includes(key)) {
            acc[key] = value ? Number(value) : null;
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      let result;
      if (compensation) {
        result = await updateCompensation(applicationId, payload);
      } else {
        result = await createCompensation(applicationId, payload);
      }

      setCompensation(result?.data || result);
      setStatus("saved");
      setIsEditing(false);

      if (onSave) {
        onSave(result?.data || result);
      }

      // Clear saved status after 2 seconds
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving compensation:", error);
      setStatus("error");
      if (onError) {
        onError(error.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!compensation) return;
    if (!window.confirm("Are you sure you want to delete this compensation data?")) return;

    setStatus("saving");
    try {
      await deleteCompensation(applicationId);
      setCompensation(null);
      setFormData({
        baseSalary: "",
        bonusSalary: "",
        signingBonus: "",
        stockEquity: "",
        benefits: "",
        currency: "USD",
        payCadence: "annual",
        locationType: "on-site",
        startDate: "",
      });
      setStatus("idle");
      setIsEditing(false);

      if (onSave) {
        onSave(null);
      }
    } catch (error) {
      console.error("Error deleting compensation:", error);
      setStatus("error");
      if (onError) {
        onError(error.message);
      }
    }
  };

  const formatCurrency = (value, currency = "USD") => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="compensation-form">
        <div className="form-group">
          <label htmlFor="baseSalary">Base Salary ({formData.currency})</label>
          <input
            type="number"
            id="baseSalary"
            name="baseSalary"
            value={formData.baseSalary}
            onChange={handleInputChange}
            placeholder="e.g., 150000"
            className="input"
            disabled={status === "saving"}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bonusSalary">Bonus Salary ({formData.currency})</label>
          <input
            type="number"
            id="bonusSalary"
            name="bonusSalary"
            value={formData.bonusSalary}
            onChange={handleInputChange}
            placeholder="e.g., 20000"
            className="input"
            disabled={status === "saving"}
          />
        </div>

        <div className="form-group">
          <label htmlFor="signingBonus">Signing Bonus ({formData.currency})</label>
          <input
            type="number"
            id="signingBonus"
            name="signingBonus"
            value={formData.signingBonus}
            onChange={handleInputChange}
            placeholder="e.g., 30000"
            className="input"
            disabled={status === "saving"}
          />
        </div>

        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="input"
            disabled={status === "saving"}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="payCadence">Pay Cadence</label>
          <select
            id="payCadence"
            name="payCadence"
            value={formData.payCadence}
            onChange={handleInputChange}
            className="input"
            disabled={status === "saving"}
          >
            <option value="annual">Annual</option>
            <option value="monthly">Monthly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="stockEquity">Stock Equity</label>
          <textarea
            id="stockEquity"
            name="stockEquity"
            value={formData.stockEquity}
            onChange={handleInputChange}
            placeholder="e.g., 10,000 shares, 4-year vest with 1-year cliff"
            className="input"
            rows={3}
            disabled={status === "saving"}
          />
        </div>

        <div className="form-group">
          <label htmlFor="benefits">Benefits</label>
          <textarea
            id="benefits"
            name="benefits"
            value={formData.benefits}
            onChange={handleInputChange}
            placeholder="e.g., 100% health coverage, 401k matching"
            className="input"
            rows={3}
            disabled={status === "saving"}
          />
        </div>

        <div className="form-group">
          <label htmlFor="locationType">Location Type</label>
          <select
            id="locationType"
            name="locationType"
            value={formData.locationType}
            onChange={handleInputChange}
            className="input"
            disabled={status === "saving"}
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on-site">On-site</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date (YYYY-MM-DD)</label>
          <input
            type="text"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            placeholder="YYYY-MM-DD"
            className="input"
            disabled={status === "saving"}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Save Compensation"}
          </button>
          <button
            type="button"
            className="btn btn-subtle"
            onClick={() => setIsEditing(false)}
            disabled={status === "saving"}
          >
            Cancel
          </button>
          {compensation && (
            <button
              type="button"
              className="btn btn-subtle btn-danger"
              onClick={handleDelete}
              disabled={status === "saving"}
            >
              Delete
            </button>
          )}
        </div>

        {status === "saved" && <p className="muted-text">✓ Compensation saved</p>}
        {status === "error" && <p className="error-text">✗ Error saving compensation</p>}
      </form>
    );
  }

  // Display view
  if (compensation) {
    return (
      <div className="compensation-display">
        <div className="compensation-item">
          <span className="label">Base Salary:</span>
          <span className="value">{formatCurrency(compensation.baseSalary, compensation.currency)}</span>
        </div>
        {compensation.bonusSalary && (
          <div className="compensation-item">
            <span className="label">Bonus:</span>
            <span className="value">{formatCurrency(compensation.bonusSalary, compensation.currency)}</span>
          </div>
        )}
        {compensation.signingBonus && (
          <div className="compensation-item">
            <span className="label">Signing Bonus:</span>
            <span className="value">{formatCurrency(compensation.signingBonus, compensation.currency)}</span>
          </div>
        )}
        {compensation.stockEquity && (
          <div className="compensation-item">
            <span className="label">Stock Equity:</span>
            <span className="value">{compensation.stockEquity}</span>
          </div>
        )}
        {compensation.benefits && (
          <div className="compensation-item">
            <span className="label">Benefits:</span>
            <span className="value">{compensation.benefits}</span>
          </div>
        )}
        {compensation.locationType && (
          <div className="compensation-item">
            <span className="label">Location:</span>
            <span className="value">{compensation.locationType}</span>
          </div>
        )}
        {compensation.startDate && (
          <div className="compensation-item">
            <span className="label">Start Date:</span>
            <span className="value">{compensation.startDate}</span>
          </div>
        )}
        <button
          type="button"
          className="btn btn-subtle"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
      </div>
    );
  }

  // Empty state
  return (
    <div className="compensation-empty">
      <p className="muted-text">No compensation data added yet</p>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsEditing(true)}
      >
        Add Compensation
      </button>
    </div>
  );
}
