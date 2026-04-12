import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("compensation-repository");

function mapCompensationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    applicationId: row.application_id,
    userId: row.user_id,
    baseSalary: row.base_salary ? Number(row.base_salary) : null,
    bonusSalary: row.bonus_salary ? Number(row.bonus_salary) : null,
    signingBonus: row.signing_bonus ? Number(row.signing_bonus) : null,
    stockEquity: row.stock_equity,
    benefits: row.benefits,
    currency: row.currency,
    payCadence: row.pay_cadence,
    locationType: row.location_type,
    startDate: row.start_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCompensationByApplicationId(applicationId, userId) {
  const query = `
    SELECT c.*
    FROM application_compensation c
    WHERE c.application_id = $1 AND c.user_id = $2
  `;
  const result = await pool.query(query, [applicationId, userId]);
  return mapCompensationRow(result.rows[0]);
}

export async function createCompensation(applicationId, userId, payload) {
  const query = `
    INSERT INTO application_compensation (
      application_id,
      user_id,
      base_salary,
      bonus_salary,
      signing_bonus,
      stock_equity,
      benefits,
      currency,
      pay_cadence,
      location_type,
      start_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const result = await pool.query(query, [
    applicationId,
    userId,
    payload.baseSalary || null,
    payload.bonusSalary || null,
    payload.signingBonus || null,
    payload.stockEquity || null,
    payload.benefits || null,
    payload.currency || "USD",
    payload.payCadence || "annual",
    payload.locationType || null,
    payload.startDate || null,
  ]);
  return mapCompensationRow(result.rows[0]);
}

export async function updateCompensation(applicationId, userId, payload) {
  const fields = [];
  const values = [applicationId, userId];
  let paramIndex = 3;

  if (Object.prototype.hasOwnProperty.call(payload, "baseSalary")) {
    fields.push(`base_salary = $${paramIndex}`);
    values.push(payload.baseSalary || null);
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "bonusSalary")) {
    fields.push(`bonus_salary = $${paramIndex}`);
    values.push(payload.bonusSalary || null);
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "signingBonus")) {
    fields.push(`signing_bonus = $${paramIndex}`);
    values.push(payload.signingBonus || null);
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "stockEquity")) {
    fields.push(`stock_equity = $${paramIndex}`);
    values.push(payload.stockEquity || null);
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "benefits")) {
    fields.push(`benefits = $${paramIndex}`);
    values.push(payload.benefits || null);
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "currency")) {
    fields.push(`currency = $${paramIndex}`);
    values.push(payload.currency || "USD");
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "payCadence")) {
    fields.push(`pay_cadence = $${paramIndex}`);
    values.push(payload.payCadence || "annual");
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "locationType")) {
    fields.push(`location_type = $${paramIndex}`);
    values.push(payload.locationType || null);
    paramIndex++;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "startDate")) {
    fields.push(`start_date = $${paramIndex}`);
    values.push(payload.startDate || null);
    paramIndex++;
  }

  if (fields.length === 0) {
    return null; // No fields to update
  }

  const query = `
    UPDATE application_compensation
    SET ${fields.join(", ")}
    WHERE application_id = $1 AND user_id = $2
    RETURNING *
  `;
  const result = await pool.query(query, values);
  return mapCompensationRow(result.rows[0]);
}

export async function deleteCompensation(applicationId, userId) {
  const query = `
    DELETE FROM application_compensation
    WHERE application_id = $1 AND user_id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [applicationId, userId]);
  return !!result.rows[0]; // Return true if deleted, false if not found
}
