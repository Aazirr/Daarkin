import { pool } from "../config/db.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("applications-repository");

function mapApplicationRow(row) {
  return {
    id: row.id,
    companyName: row.company_name,
    positionTitle: row.position_title,
    location: row.location,
    applicationUrl: row.application_url,
    status: row.status,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listApplications() {
  logger.info("Executing list applications query");
  const result = await pool.query(
    `
      SELECT id, company_name, position_title, location, application_url, status, applied_at, created_at, updated_at
      FROM applications
      ORDER BY updated_at DESC, created_at DESC
    `
  );

  logger.info("List applications query completed", { rows: result.rowCount });
  return result.rows.map(mapApplicationRow);
}

export async function getApplicationById(id) {
  logger.info("Executing get application query", { id });
  const result = await pool.query(
    `
      SELECT id, company_name, position_title, location, application_url, status, applied_at, created_at, updated_at
      FROM applications
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  logger.info("Get application query completed", { found: Boolean(result.rows[0]) });
  return result.rows[0] ? mapApplicationRow(result.rows[0]) : null;
}

export async function createApplication(input) {
  logger.info("Executing create application query", {
    companyName: input.companyName,
    positionTitle: input.positionTitle,
    status: input.status,
  });
  const result = await pool.query(
    `
      INSERT INTO applications (
        company_name,
        position_title,
        location,
        application_url,
        status,
        applied_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, company_name, position_title, location, application_url, status, applied_at, created_at, updated_at
    `,
    [
      input.companyName,
      input.positionTitle,
      input.location ?? null,
      input.applicationUrl ?? null,
      input.status,
      input.appliedAt || null,
    ]
  );

  logger.info("Create application query completed", { id: result.rows[0].id });
  return mapApplicationRow(result.rows[0]);
}

export async function updateApplication(id, input) {
  logger.info("Executing update application flow", { id, fields: Object.keys(input) });
  const current = await getApplicationById(id);

  if (!current) {
    return null;
  }

  const next = {
    companyName: input.companyName ?? current.companyName,
    positionTitle: input.positionTitle ?? current.positionTitle,
    location: Object.prototype.hasOwnProperty.call(input, "location")
      ? input.location
      : current.location,
    applicationUrl: Object.prototype.hasOwnProperty.call(input, "applicationUrl")
      ? input.applicationUrl
      : current.applicationUrl,
    status: input.status ?? current.status,
    appliedAt: Object.prototype.hasOwnProperty.call(input, "appliedAt")
      ? input.appliedAt
      : current.appliedAt,
  };

  const result = await pool.query(
    `
      UPDATE applications
      SET company_name = $2,
          position_title = $3,
          location = $4,
          application_url = $5,
          status = $6,
          applied_at = $7
      WHERE id = $1
      RETURNING id, company_name, position_title, location, application_url, status, applied_at, created_at, updated_at
    `,
    [
      id,
      next.companyName,
      next.positionTitle,
      next.location ?? null,
      next.applicationUrl ?? null,
      next.status,
      next.appliedAt || null,
    ]
  );

  logger.info("Update application query completed", { id: result.rows[0].id });
  return mapApplicationRow(result.rows[0]);
}

export async function deleteApplication(id) {
  logger.info("Executing delete application query", { id });
  const result = await pool.query("DELETE FROM applications WHERE id = $1 RETURNING id", [id]);
  logger.info("Delete application query completed", { id, deleted: result.rowCount > 0 });
  return result.rowCount > 0;
}
