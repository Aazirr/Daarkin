import { useEffect, useMemo, useState } from "react";
import { APPLICATION_STATUSES } from "@jat/shared";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  updateApplication,
} from "./services/applications-api";

const STATUS_LABELS = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const DEFAULT_FORM = {
  companyName: "",
  positionTitle: "",
  location: "",
  applicationUrl: "",
  status: "applied",
  appliedAt: "",
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return dateFormatter.format(new Date(value));
}

function cleanPayload(form) {
  return {
    companyName: form.companyName.trim(),
    positionTitle: form.positionTitle.trim(),
    location: form.location.trim(),
    applicationUrl: form.applicationUrl.trim(),
    status: form.status,
    appliedAt: form.appliedAt,
  };
}

export default function App() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchApplications();
      setApplications(data.applications || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const summary = useMemo(() => {
    return APPLICATION_STATUSES.reduce(
      (accumulator, status) => {
        accumulator[status] = applications.filter((application) => application.status === status).length;
        return accumulator;
      },
      { applied: 0, interview: 0, offer: 0, rejected: 0 }
    );
  }, [applications]);

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  }

  function startEdit(application) {
    setEditingId(application.id);
    setForm({
      companyName: application.companyName || "",
      positionTitle: application.positionTitle || "",
      location: application.location || "",
      applicationUrl: application.applicationUrl || "",
      status: application.status || "applied",
      appliedAt: application.appliedAt ? application.appliedAt.slice(0, 10) : "",
    });
    setMessage(`Editing ${application.companyName}.`);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = cleanPayload(form);
      const request = editingId ? updateApplication(editingId, payload) : createApplication(payload);
      await request;
      await loadApplications();
      setMessage(editingId ? "Application updated." : "Application created.");
      resetForm();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(application) {
    const confirmed = window.confirm(`Delete application for ${application.companyName}?`);

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteApplication(application.id);
      await loadApplications();
      if (editingId === application.id) {
        resetForm();
      }
      setMessage("Application deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(64,99,67,0.18),_transparent_30%),linear-gradient(180deg,_#f7f3e8_0%,_#f3efe6_100%)] px-4 py-8 text-ink md:px-8">
      <main className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-black/10 bg-white/90 shadow-[0_24px_80px_rgba(22,23,20,0.08)] backdrop-blur">
          <div className="grid gap-8 p-6 md:grid-cols-[1.05fr_1.4fr] md:p-10">
            <div className="space-y-6">
              <header className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-moss">Phase 1</p>
                <h1 className="max-w-md text-4xl font-semibold leading-tight md:text-5xl">
                  Track every job application without losing the thread.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-black/70 md:text-base">
                  Add roles, update status, edit details, and remove old entries from one focused workspace.
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(summary).map(([status, count]) => (
                  <div key={status} className="rounded-2xl border border-black/10 bg-oat/70 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-black/45">{STATUS_LABELS[status]}</div>
                    <div className="mt-2 text-2xl font-semibold">{count}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-moss/15 bg-moss/5 p-4 text-sm text-black/75">
                <div className="font-semibold text-moss">What is wired now</div>
                <ul className="mt-2 space-y-1">
                  <li>Application CRUD API with PostgreSQL-backed persistence</li>
                  <li>Responsive editor form</li>
                  <li>List cards with edit and delete actions</li>
                  <li>Vite proxy for local API calls and relative routes for Vercel</li>
                </ul>
              </div>

              {message ? (
                <div className="rounded-2xl border border-moss/20 bg-moss/10 px-4 py-3 text-sm text-moss">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="grid gap-6">
              <form
                onSubmit={handleSubmit}
                className="rounded-[1.75rem] border border-black/10 bg-oat/40 p-5 md:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{editingId ? "Edit application" : "New application"}</h2>
                    <p className="text-sm text-black/60">Keep the core details in one place.</p>
                  </div>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-white"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium">
                    Company name
                    <input
                      required
                      value={form.companyName}
                      onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-moss/40"
                      placeholder="Acme Corp"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    Position title
                    <input
                      required
                      value={form.positionTitle}
                      onChange={(event) => setForm({ ...form, positionTitle: event.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-moss/40"
                      placeholder="Frontend Developer"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    Location
                    <input
                      value={form.location}
                      onChange={(event) => setForm({ ...form, location: event.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-moss/40"
                      placeholder="Remote"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    Application URL
                    <input
                      type="url"
                      value={form.applicationUrl}
                      onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-moss/40"
                      placeholder="https://jobs.example.com/123"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    Status
                    <select
                      value={form.status}
                      onChange={(event) => setForm({ ...form, status: event.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-moss/40"
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium">
                    Applied date
                    <input
                      type="date"
                      value={form.appliedAt}
                      onChange={(event) => setForm({ ...form, appliedAt: event.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-moss/40"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-5 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update application" : "Add application"}
                </button>
              </form>

              <section className="rounded-[1.75rem] border border-black/10 bg-white p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Applications</h2>
                    <p className="text-sm text-black/60">Most recent updates appear first.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadApplications}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-oat"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-oat/40 p-6 text-sm text-black/60">
                      Loading applications...
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-oat/40 p-6 text-sm text-black/60">
                      No applications yet. Create the first one using the form.
                    </div>
                  ) : (
                    applications.map((application) => (
                      <article
                        key={application.id}
                        className="rounded-2xl border border-black/10 bg-oat/50 p-4 transition hover:-translate-y-0.5 hover:border-moss/20 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold">{application.companyName}</h3>
                              <span className="rounded-full border border-moss/20 bg-white px-3 py-1 text-xs font-medium text-moss">
                                {STATUS_LABELS[application.status]}
                              </span>
                            </div>
                            <p className="text-sm text-black/70">{application.positionTitle}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-black/55">
                              <span>{application.location || "Location not set"}</span>
                              <span>Applied {formatDate(application.appliedAt)}</span>
                              <span>Updated {formatDate(application.updatedAt)}</span>
                            </div>
                            {application.applicationUrl ? (
                              <a
                                href={application.applicationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-sm font-medium text-moss underline-offset-4 hover:underline"
                              >
                                Open application
                              </a>
                            ) : null}
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(application)}
                              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-ink hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(application)}
                              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
