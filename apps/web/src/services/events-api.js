const API_BASE = "/api";
import { isUnauthorizedResponse, notifySessionExpired } from "./session-expiry.js";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
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
    payload = rawBody ? JSON.parse(rawBody) : null;
  }

  if (!response.ok || payload?.success === false) {
    if (isUnauthorizedResponse(response, payload)) {
      notifySessionExpired({ path, message: payload?.error?.message || rawBody });
    }

    throw new Error(payload?.error?.message || `Request to ${path} failed with status ${response.status}.`);
  }

  return payload.data;
}

export async function fetchApplicationEvents(applicationId) {
  return request(`/applications/${applicationId}/events`);
}

export async function createApplicationEvent(applicationId, payload) {
  return request(`/applications/${applicationId}/events`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateApplicationEvent(eventId, payload) {
  return request(`/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteApplicationEvent(eventId) {
  return request(`/events/${eventId}`, {
    method: "DELETE",
  });
}

export async function fetchUpcomingEvents(days = 2) {
  return request(`/events/upcoming?days=${days}`);
}
