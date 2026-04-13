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
    statusChangedAt: row.status_changed_at,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listApplications(userId, query) {
  const {
    q,
    status,
    sortBy = "updatedAt",
    sortOrder = "desc",
    page = 1,
    pageSize = 20,
  } = query;

  logger.info("Executing list applications query", { userId, q, status, sortBy, sortOrder, page, pageSize });

  const sortColumnMap = {
    updatedAt: "a.updated_at",
    appliedAt: "a.applied_at",
    createdAt: "a.created_at",
    companyName: "a.company_name",
    status: "a.status",
  };

  const whereClauses = ["a.user_id = $1"];
  const whereParams = [userId];

  if (status) {
    whereParams.push(status);
    whereClauses.push(`a.status = $${whereParams.length}`);
  }

  if (q) {
    whereParams.push(`%${q}%`);
    const searchIndex = whereParams.length;
    whereClauses.push(`(
      a.company_name ILIKE $${searchIndex}
      OR a.position_title ILIKE $${searchIndex}
      OR COALESCE(a.location, '') ILIKE $${searchIndex}
      OR EXISTS (
        SELECT 1
        FROM application_notes an
        WHERE an.application_id = a.id
          AND an.note_text ILIKE $${searchIndex}
      )
    )`);
  }

  const whereSql = whereClauses.join(" AND ");
  const sortColumn = sortColumnMap[sortBy] || sortColumnMap.updatedAt;
  const order = sortOrder === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * pageSize;

  const countResult = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM applications a
      WHERE ${whereSql}
    `,
    whereParams
  );

  const total = countResult.rows[0]?.total || 0;

  const result = await pool.query(
    `
      SELECT id, company_name, position_title, location, application_url, status, status_changed_at, applied_at, created_at, updated_at, user_id
      FROM applications a
      WHERE ${whereSql}
      ORDER BY ${sortColumn} ${order} NULLS LAST, a.created_at DESC
      LIMIT $${whereParams.length + 1}
      OFFSET $${whereParams.length + 2}
    `,
    [...whereParams, pageSize, offset]
  );

  logger.info("List applications query completed", { userId, rows: result.rowCount, total });
  
  // Get status counts for all applications matching the filters (not just current page)
  const statusCountResult = await pool.query(
    `
      SELECT status, COUNT(*)::int AS count
      FROM applications a
      WHERE ${whereSql}
      GROUP BY status
    `,
    whereParams
  );
  
  const statusCounts = {
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };
  
  statusCountResult.rows.forEach((row) => {
    if (statusCounts.hasOwnProperty(row.status)) {
      statusCounts[row.status] = row.count;
    }
  });
  
  return {
    applications: result.rows.map(mapApplicationRow),
    total,
    statusCounts,
  };
}

export async function getApplicationById(id, userId) {
  logger.info("Executing get application query", { id, userId });
  const result = await pool.query(
    `
      SELECT id, company_name, position_title, location, application_url, status, status_changed_at, applied_at, created_at, updated_at, user_id
      FROM applications
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [id, userId]
  );

  logger.info("Get application query completed", { id, userId, found: Boolean(result.rows[0]) });
  return result.rows[0] ? mapApplicationRow(result.rows[0]) : null;
}

export async function createApplication(userId, input) {
  logger.info("Executing create application query", {
    userId,
    companyName: input.companyName,
    positionTitle: input.positionTitle,
    status: input.status,
  });
  const result = await pool.query(
    `
      INSERT INTO applications (
        user_id,
        company_name,
        position_title,
        location,
        application_url,
        status,
        applied_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, company_name, position_title, location, application_url, status, status_changed_at, applied_at, created_at, updated_at, user_id
    `,
    [
      userId,
      input.companyName,
      input.positionTitle,
      input.location ?? null,
      input.applicationUrl ?? null,
      input.status,
      input.appliedAt || null,
    ]
  );

  logger.info("Create application query completed", { userId, id: result.rows[0].id });
  return mapApplicationRow(result.rows[0]);
}

export async function updateApplication(id, userId, input) {
  logger.info("Executing update application flow", { id, userId, fields: Object.keys(input) });
  const current = await getApplicationById(id, userId);

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
      WHERE id = $1 AND user_id = $8
      RETURNING id, company_name, position_title, location, application_url, status, status_changed_at, applied_at, created_at, updated_at, user_id
    `,
    [
      id,
      next.companyName,
      next.positionTitle,
      next.location ?? null,
      next.applicationUrl ?? null,
      next.status,
      next.appliedAt || null,
      userId,
    ]
  );

  logger.info("Update application query completed", { id, userId });
  return mapApplicationRow(result.rows[0]);
}

export async function deleteApplication(id, userId) {
  logger.info("Executing delete application query", { id, userId });
  const result = await pool.query(
    "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  logger.info("Delete application query completed", { id, userId, deleted: result.rowCount > 0 });
  return result.rowCount > 0;
}
