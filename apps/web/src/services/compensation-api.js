const API_BASE = "/api";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

function log(action, details) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.info(`[web:compensation-api] ${action}${suffix}`);
}

async function request(path, options = {}) {
  log("request-start", { path, method: options.method || "GET" });

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const rawBody = await response.text();

    if (!response.ok) {
      const error = new Error(rawBody || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.body = rawBody;
      throw error;
    }

    if (rawBody.length === 0) {
      log("request-end", { path, status: response.status, dataLength: 0 });
      return null;
    }

    const data = JSON.parse(rawBody);
    log("request-end", { path, status: response.status, dataLength: rawBody.length });
    return data;
  } catch (error) {
    log("request-error", { path, error: error.message });
    throw error;
  }
}

export async function fetchCompensation(applicationId) {
  return request(`/applications/${applicationId}/compensation`);
}

export async function createCompensation(applicationId, payload) {
  return request(`/applications/${applicationId}/compensation`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCompensation(applicationId, payload) {
  return request(`/applications/${applicationId}/compensation`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCompensation(applicationId) {
  return request(`/applications/${applicationId}/compensation`, {
    method: "DELETE",
  });
}
