let onSessionExpired = null;
let hasActiveExpiryNotice = false;

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export function notifySessionExpired(details = {}) {
  if (hasActiveExpiryNotice) {
    return;
  }

  hasActiveExpiryNotice = true;
  onSessionExpired?.(details);
}

export function clearSessionExpiredNotice() {
  hasActiveExpiryNotice = false;
}

export function isUnauthorizedResponse(response, payload) {
  return response.status === 401 || payload?.error?.code === "UNAUTHORIZED";
}
