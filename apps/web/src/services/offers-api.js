const API_BASE = "/api";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

function log(action, details) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.info(`[web:offers-api] ${action}${suffix}`);
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

  if (snippet.startsWith("The page could not be found") || snippet.includes("NOT_FOUND")) {
    return `API route not found for ${path} (status ${response.status}). Verify Vercel API routing for /api.`;
  }

  if (snippet) {
    return `Request to ${path} failed (${response.status}). ${snippet}`;
  }

  return `Request to ${path} failed with status ${response.status} (${contentType}).`;
}

async function requestWithMeta(path, options = {}) {
  log("request-start", { path, method: options.method || "GET" });

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  let payload = null;

  if (contentType.includes("application/json")) {
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      throw new Error(`API returned invalid JSON from ${path}.`);
    }
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || formatHttpError(response, rawBody, path);
    throw new Error(message);
  }

  return {
    data: payload?.data ?? null,
    meta: payload?.meta ?? null,
  };
}

/**
 * Fetch all offers for the authenticated user with compensation and scoring data
 * Returns: { offers: Array, weights: Object, count: Number }
 */
export async function fetchOffers() {
  const path = "/offers";
  return requestWithMeta(path).then((result) => result.data);
}

/**
 * Fetch a single offer with compensation and scoring data
 * Returns: { offer: Object, weights: Object }
 */
export async function fetchOffer(offerId) {
  const path = `/offers/${offerId}`;
  return requestWithMeta(path).then((result) => result.data);
}
