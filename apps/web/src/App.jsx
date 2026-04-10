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
    <div className="min-h-screen bg-cloudPearl px-4 py-8 text-charcoal md:px-8">
      <main className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-10 space-y-3 border-b border-silverMist pb-8">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 bg-oxblood rounded-full"></div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oxblood">Job Tracker</p>
          </div>
          <h1 className="text-5xl font-light tracking-tight text-charcoal md:text-6xl">
            Track Every Opportunity
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-charcoal/70">
            Manage your job applications with a clean, professional interface. Add roles, track progress, and never lose sight of an opportunity.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
          {/* Left: Summary Stats and Info */}
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(summary).map(([status, count]) => (
                <div key={status} className="rounded-xl border border-silverMist bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-widest text-charcoal/50">
                    {STATUS_LABELS[status]}
                  </div>
                  <div className="mt-3 text-3xl font-light text-oxblood">{count}</div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="rounded-xl border border-gold/30 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-0.5 w-4 bg-gold rounded-full"></div>
                <h3 className="text-sm font-semibold text-gold">Premium Features</h3>
              </div>
              <ul className="space-y-2 text-sm text-charcoal/70">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-gold flex-shrink-0" />
                  <span>Full CRUD application management</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-gold flex-shrink-0" />
                  <span>Status tracking with timeline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-gold flex-shrink-0" />
                  <span>PostgreSQL-backed persistence</span>
                </li>
              </ul>
            </div>

            {/* Messages */}
            {message ? (
              <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 px-4 py-3 text-sm text-oxblood">
                ✓ {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                ✖ {error}
              </div>
            ) : null}
          </div>

          {/* Right: Form and List */}
          <div className="space-y-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="rounded-xl border border-silverMist bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-charcoal">
                    {editingId ? "Edit Application" : "Add Application"}
                  </h2>
                  <p className="text-sm text-charcoal/50">Save your opportunity details</p>
                </div>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-charcoal/70 transition hover:bg-silverMist"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm font-medium text-charcoal">
                    Company Name
                    <input
                      required
                      value={form.companyName}
                      onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                      className="w-full rounded-lg border border-silverMist bg-cloudPearl px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-oxblood focus:ring-1 focus:ring-oxblood/20"
                      placeholder="Acme Corp"
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-charcoal">
                    Position Title
                    <input
                      required
                      value={form.positionTitle}
                      onChange={(event) => setForm({ ...form, positionTitle: event.target.value })}
                      className="w-full rounded-lg border border-silverMist bg-cloudPearl px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-oxblood focus:ring-1 focus:ring-oxblood/20"
                      placeholder="Frontend Developer"
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-charcoal">
                    Location
                    <input
                      value={form.location}
                      onChange={(event) => setForm({ ...form, location: event.target.value })}
                      className="w-full rounded-lg border border-silverMist bg-cloudPearl px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-oxblood focus:ring-1 focus:ring-oxblood/20"
                      placeholder="Remote"
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-charcoal">
                    Application URL
                    <input
                      type="url"
                      value={form.applicationUrl}
                      onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })}
                      className="w-full rounded-lg border border-silverMist bg-cloudPearl px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-oxblood focus:ring-1 focus:ring-oxblood/20"
                      placeholder="https://jobs.example.com/123"
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-charcoal">
                    Status
                    <select
                      value={form.status}
                      onChange={(event) => setForm({ ...form, status: event.target.value })}
                      className="w-full rounded-lg border border-silverMist bg-cloudPearl px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-oxblood focus:ring-1 focus:ring-oxblood/20"
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-charcoal">
                    Applied Date
                    <input
                      type="date"
                      value={form.appliedAt}
                      onChange={(event) => setForm({ ...form, appliedAt: event.target.value })}
                      className="w-full rounded-lg border border-silverMist bg-cloudPearl px-3 py-2.5 text-sm text-charcoal outline-none transition focus:border-oxblood focus:ring-1 focus:ring-oxblood/20"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 w-full rounded-lg bg-oxblood px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-oxblood/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Application" : "Add Application"}
                </button>
              </div>
            </form>

            {/* Applications List */}
            <section className="rounded-xl border border-silverMist bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-charcoal">Applications</h2>
                  <p className="text-sm text-charcoal/50">Most recent updates first</p>
                </div>
                <button
                  type="button"
                  onClick={loadApplications}
                  className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-charcoal/70 transition hover:bg-silverMist"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="rounded-lg border border-dashed border-silverMist bg-cloudPearl p-8 text-center text-sm text-charcoal/50">
                    Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-silverMist bg-cloudPearl p-8 text-center text-sm text-charcoal/50">
                    No applications yet. Create your first one above.
                  </div>
                ) : (
                  applications.map((application) => (
                    <article
                      key={application.id}
                      className="rounded-lg border border-silverMist bg-cloudPearl p-4 transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-charcoal">{application.companyName}</h3>
                            <span className="rounded-full border border-oxblood/30 bg-oxblood/10 px-2.5 py-0.5 text-xs font-medium text-oxblood">
                              {STATUS_LABELS[application.status]}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-charcoal/70">{application.positionTitle}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-charcoal/50">
                            <span>{application.location || "Location not specified"}</span>
                            <span>Applied {formatDate(application.appliedAt)}</span>
                            <span>Updated {formatDate(application.updatedAt)}</span>
                          </div>
                          {application.applicationUrl ? (
                            <a
                              href={application.applicationUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex text-xs font-medium text-oxblood underline-offset-2 hover:underline"
                            >
                              View Posting →
                            </a>
                          ) : null}
                        </div>

                        <div className="flex gap-2 md:flex-col">
                          <button
                            type="button"
                            onClick={() => startEdit(application)}
                            className="rounded-lg border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-charcoal/70 transition hover:bg-oxblood hover:text-white hover:border-oxblood"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(application)}
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
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
      </main>
    </div>
  );
}
