const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json();

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || "Request failed.";
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
