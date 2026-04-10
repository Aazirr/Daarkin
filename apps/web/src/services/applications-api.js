const API_BASE = "/api";

function log(action, details) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.info(`[web:applications-api] ${action}${suffix}`);
}

function sanitizeBodySnippet(rawBody) {
  if (!rawBody) {
    return "";
  }

  return rawBody.replace(/\s+/g, " ").trim().slice(0, 180);
}

function formatHttpError(response, rawBody, path) {
  const snippet = sanitizeBodySnippet(rawBody);
  const contentType = response.headers.get("content-type") || "unknown";

  // Vercel edge/pages 404 often returns plain text like:
  // "The page could not be found NOT_FOUND ..."
  if (snippet.startsWith("The page could not be found") || snippet.includes("NOT_FOUND")) {
    return `API route not found for ${path} (status ${response.status}). Verify Vercel API routing for /api.`;
  }

  if (snippet) {
    return `Request to ${path} failed (${response.status}). ${snippet}`;
  }

  return `Request to ${path} failed with status ${response.status} (${contentType}).`;
}

async function request(path, options = {}) {
  log("request-start", { path, method: options.method || "GET" });
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  let payload = null;

  if (contentType.includes("application/json")) {
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch (parseError) {
      log("request-parse-error", {
        path,
        status: response.status,
        contentType,
        snippet: rawBody.slice(0, 120),
      });
      throw new Error(`API returned invalid JSON from ${path}.`);
    }
  } else {
    log("request-non-json-response", {
      path,
      url: response.url,
      status: response.status,
      contentType,
      snippet: rawBody.slice(0, 120),
    });
  }

  log("request-finish", { path, status: response.status, success: payload?.success !== false });

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || formatHttpError(response, rawBody, path);
    log("request-error", { path, status: response.status, message });
    throw new Error(message);
  }

  return payload.data;
}

export async function fetchApplications() {
  return request("/applications");
}

export async function createApplication(payload) {
  return request("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateApplication(id, payload) {
  return request(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteApplication(id) {
  return request(`/applications/${id}`, {
    method: "DELETE",
  });
}
