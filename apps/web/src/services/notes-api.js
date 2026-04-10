const API_BASE = "/api";

function log(action, details) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.info(`[web:notes-api] ${action}${suffix}`);
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
    const message = payload?.error?.message || `Request to ${path} failed with status ${response.status}.`;
    log("request-error", { path, status: response.status, message });
    throw new Error(message);
  }

  return payload.data;
}

export async function fetchNotes(applicationId) {
  return request(`/applications/${applicationId}/notes`);
}

export async function createNote(applicationId, payload) {
  return request(`/applications/${applicationId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateNote(noteId, payload) {
  return request(`/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(noteId) {
  return request(`/notes/${noteId}`, {
    method: "DELETE",
  });
}
