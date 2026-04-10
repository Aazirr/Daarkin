import { useEffect, useMemo, useState } from "react";
import { APPLICATION_STATUSES } from "@jat/shared";
import { useAuth } from "./hooks/useAuth";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  updateApplication,
  setAuthToken as setAppAuthToken,
} from "./services/applications-api.js";
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  setAuthToken as setNotesAuthToken,
} from "./services/notes-api.js";

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

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Phase 4: Search, filter, sort, pagination
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Notes state
  const [expandedNotesId, setExpandedNotesId] = useState(null);
  const [notes, setNotes] = useState({});
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Set auth token in API services when token changes
  useEffect(() => {
    if (token) {
      setAppAuthToken(token);
      setNotesAuthToken(token);
    }
  }, [token]);

  async function loadApplications() {
    setLoading(true);
    setError("");
    console.info("[web:dashboard] load-applications-start");

    try {
      const result = await fetchApplications({
        q: searchText.trim(),
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      setApplications(result.data?.applications || []);
      setTotal(result.meta?.pagination?.total || 0);
      setTotalPages(result.meta?.pagination?.totalPages || 1);

      console.info("[web:dashboard] load-applications-success", {
        count: result.data?.applications?.length || 0,
        total: result.meta?.pagination?.total || 0,
        page: result.meta?.pagination?.page || page,
      });
    } catch (loadError) {
      console.error("[web:dashboard] load-applications-failed", loadError);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [searchText, statusFilter, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchText, statusFilter, sortBy, sortOrder, pageSize]);

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
    console.info("[web:dashboard] start-edit", { id: application.id, companyName: application.companyName });
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
    console.info("[web:dashboard] submit-start", { editingId: editingId || null });

    try {
      const payload = cleanPayload(form);
      const request = editingId ? updateApplication(editingId, payload) : createApplication(payload);
      await request;
      await loadApplications();
      setMessage(editingId ? "Application updated." : "Application created.");
      console.info("[web:dashboard] submit-success", { action: editingId ? "update" : "create" });
      resetForm();
    } catch (submitError) {
      console.error("[web:dashboard] submit-failed", submitError);
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(application) {
    const confirmed = window.confirm(`Delete application for ${application.companyName}?`);

    if (!confirmed) {
      console.info("[web:dashboard] delete-cancelled", { id: application.id });
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    console.info("[web:dashboard] delete-start", { id: application.id, companyName: application.companyName });

    try {
      await deleteApplication(application.id);
      await loadApplications();
      if (editingId === application.id) {
        resetForm();
      }
      setMessage("Application deleted.");
      console.info("[web:dashboard] delete-success", { id: application.id });
    } catch (deleteError) {
      console.error("[web:dashboard] delete-failed", deleteError);
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  }

  async function loadNotesForApplication(applicationId) {
    setLoadingNotes(true);
    console.info("[web:dashboard] load-notes-start", { applicationId });

    try {
      const data = await fetchNotes(applicationId);
      setNotes((prev) => ({
        ...prev,
        [applicationId]: data.notes || [],
      }));
      console.info("[web:dashboard] load-notes-success", { applicationId, count: data.notes?.length || 0 });
    } catch (loadError) {
      console.error("[web:dashboard] load-notes-failed", loadError);
      setError(loadError.message);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function handleAddNote(applicationId) {
    if (!newNoteText.trim()) {
      setError("Please enter a note before saving.");
      return;
    }

    setSavingNote(true);
    setError("");
    setMessage("");
    console.info("[web:dashboard] create-note-start", { applicationId, textLength: newNoteText.length });

    try {
      await createNote(applicationId, { noteText: newNoteText });
      setNewNoteText("");
      await loadNotesForApplication(applicationId);
      setMessage("Note added successfully.");
      console.info("[web:dashboard] create-note-success", { applicationId });
    } catch (createError) {
      console.error("[web:dashboard] create-note-failed", createError);
      setError(createError.message);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(applicationId, noteId) {
    const confirmed = window.confirm("Delete this note?");

    if (!confirmed) {
      console.info("[web:dashboard] delete-note-cancelled", { noteId });
      return;
    }

    setSavingNote(true);
    setError("");
    setMessage("");
    console.info("[web:dashboard] delete-note-start", { noteId, applicationId });

    try {
      await deleteNote(noteId);
      await loadNotesForApplication(applicationId);
      setMessage("Note deleted successfully.");
      console.info("[web:dashboard] delete-note-success", { noteId });
    } catch (deleteError) {
      console.error("[web:dashboard] delete-note-failed", deleteError);
      setError(deleteError.message);
    } finally {
      setSavingNote(false);
    }
  }

  function toggleNotesExpanded(applicationId) {
    if (expandedNotesId === applicationId) {
      setExpandedNotesId(null);
    } else {
      setExpandedNotesId(applicationId);
      if (!notes[applicationId]) {
        loadNotesForApplication(applicationId);
      }
    }
  }

  function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (confirmed) {
      logout();
      console.info("[web:dashboard] logout-success", { email: user?.email });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-slate/5 px-4 py-8 text-charcoal md:px-8">
      <main className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-3 bg-gradient-to-r from-oxblood to-teal rounded-full"></div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate">Opportunity Tracker</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">Welcome, <span className="font-semibold text-slate">{user?.email?.split("@")[0]}</span></span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100 shadow-sm-soft"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-slate via-oxblood to-slate bg-clip-text text-transparent">
              Manage Every Application
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              Track job opportunities with a sophisticated, professional interface. Never lose track of where you applied, your progress, or next steps.
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-slate/20 via-slate/10 to-transparent mt-6"></div>
        </header>

        <div className="grid gap-10 md:grid-cols-[0.9fr_1.4fr]">
          {/* Left: Summary Stats and Info */}
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate/60 px-1">Overview</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(summary).map(([status, count]) => (
                  <div key={status} className="rounded-lg bg-gradient-to-br from-white to-slate/5 border border-slate/10 p-5 shadow-sm-soft hover:shadow-md-soft transition-shadow">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate/70">
                      {STATUS_LABELS[status]}
                    </div>
                    <div className="mt-3 text-4xl font-bold bg-gradient-to-r from-slate to-oxblood bg-clip-text text-transparent">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-gradient-to-br from-white to-teal/5 border border-teal/20 p-6 shadow-md-soft">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-1 w-5 bg-gradient-to-r from-teal to-slate rounded-full"></div>
                <h3 className="text-sm font-bold text-slate uppercase tracking-wider">Ready to Use</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal flex-shrink-0" />
                  <span className="font-medium">Complete CRUD for job applications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal flex-shrink-0" />
                  <span className="font-medium">Real-time status tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal flex-shrink-0" />
                  <span className="font-medium">PostgreSQL-backed persistence</span>
                </li>
              </ul>
            </div>

            {/* Messages */}
            {message ? (
              <div className="rounded-lg border border-teal/30 bg-gradient-to-r from-teal/10 to-slate/5 px-4 py-3 text-sm font-medium text-teal shadow-sm-soft">
                ✓ {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-50/30 px-4 py-3 text-sm font-medium text-red-700 shadow-sm-soft">
                ✗ {error}
              </div>
            ) : null}
          </div>

          {/* Right: Form and List */}
          <div className="space-y-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="rounded-lg border border-slate/15 bg-gradient-to-br from-white to-slate/2 p-8 shadow-md-soft">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate">
                    {editingId ? "Edit Application" : "Add New Application"}
                  </h2>
                  <p className="text-sm text-muted mt-1">Capture opportunity details and track progress</p>
                </div>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted transition hover:bg-slate/5 hover:text-slate"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>

              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Company Name</span>
                    <input
                      required
                      value={form.companyName}
                      onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft placeholder:text-muted/50"
                      placeholder="Acme Corp"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Position Title</span>
                    <input
                      required
                      value={form.positionTitle}
                      onChange={(event) => setForm({ ...form, positionTitle: event.target.value })}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft placeholder:text-muted/50"
                      placeholder="Frontend Developer"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Location</span>
                    <input
                      value={form.location}
                      onChange={(event) => setForm({ ...form, location: event.target.value })}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft placeholder:text-muted/50"
                      placeholder="Remote"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Application URL</span>
                    <input
                      type="url"
                      value={form.applicationUrl}
                      onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft placeholder:text-muted/50"
                      placeholder="https://jobs.example.com/123"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Status</span>
                    <select
                      value={form.status}
                      onChange={(event) => setForm({ ...form, status: event.target.value })}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft"
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Applied Date</span>
                    <input
                      type="date"
                      value={form.appliedAt}
                      onChange={(event) => setForm({ ...form, appliedAt: event.target.value })}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10 focus:shadow-md-soft"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-4 w-full rounded-lg bg-gradient-to-r from-slate to-slate px-4 py-3.5 text-sm font-bold text-white transition hover:shadow-lg-soft shadow-md-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update Application" : "Add Application"}
                </button>
              </div>
            </form>

            {/* Applications List */}
            <section className="rounded-lg border border-slate/15 bg-gradient-to-br from-white to-slate/2 p-8 shadow-md-soft">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate">Your Applications</h2>
                  <p className="text-sm text-muted mt-1">Search, filter, and sort your pipeline</p>
                </div>
                <button
                  type="button"
                  onClick={loadApplications}
                  className="rounded-lg border border-slate/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted transition hover:bg-slate/5 hover:text-slate"
                >
                  Refresh
                </button>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="font-bold text-slate">Search</span>
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    className="w-full rounded-lg border border-slate/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10"
                    placeholder="Company, role, location, or notes"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-bold text-slate">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-lg border border-slate/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10"
                  >
                    <option value="all">All statuses</option>
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10"
                    >
                      <option value="updatedAt">Updated</option>
                      <option value="appliedAt">Applied Date</option>
                      <option value="createdAt">Created</option>
                      <option value="companyName">Company</option>
                      <option value="status">Status</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="font-bold text-slate">Order</span>
                    <select
                      value={sortOrder}
                      onChange={(event) => setSortOrder(event.target.value)}
                      className="w-full rounded-lg border border-slate/15 bg-white px-4 py-2.5 text-sm text-charcoal outline-none transition focus:border-slate focus:ring-2 focus:ring-slate/10"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="rounded-lg border border-dashed border-slate/15 bg-gradient-to-br from-slate/2 to-slate/5 p-12 text-center text-sm text-muted">
                    Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate/15 bg-gradient-to-br from-slate/2 to-slate/5 p-12 text-center text-sm text-muted">
                    No applications found for the current search/filter.
                  </div>
                ) : (
                  applications.map((application) => (
                    <div key={application.id}>
                      <article className="rounded-lg border border-slate/10 bg-gradient-to-br from-white to-white/50 p-5 transition hover:shadow-md-soft hover:border-slate/20">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-bold text-lg text-slate">{application.companyName}</h3>
                              <span className="inline-block rounded-full border border-teal/30 bg-gradient-to-r from-teal/10 to-slate/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal">
                                {STATUS_LABELS[application.status]}
                              </span>
                            </div>
                            <p className="mt-2 text-base font-semibold text-charcoal">{application.positionTitle}</p>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted font-medium">
                              <span>📍 {application.location || "Location not specified"}</span>
                              <span>📅 Applied {formatDate(application.appliedAt)}</span>
                              <span>🏷 Status updated {formatDate(application.statusChangedAt)}</span>
                              <span>🔄 Updated {formatDate(application.updatedAt)}</span>
                            </div>
                            {application.applicationUrl ? (
                              <a
                                href={application.applicationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex gap-1 text-sm font-bold text-teal underline-offset-2 hover:underline"
                              >
                                Open Job Post →
                              </a>
                            ) : null}
                          </div>

                          <div className="flex gap-2 md:flex-col md:shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleNotesExpanded(application.id)}
                              className="rounded-lg border border-teal/20 bg-gradient-to-br from-teal/10 to-teal/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-teal transition hover:bg-teal hover:text-white hover:border-teal/80 shadow-sm-soft"
                            >
                              📝 Notes
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(application)}
                              className="rounded-lg border border-slate/20 bg-gradient-to-br from-slate/10 to-slate/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate transition hover:bg-slate hover:text-white hover:border-slate/80 shadow-sm-soft"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(application)}
                              className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100 shadow-sm-soft"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>

                      {/* Notes Panel - Show when expanded */}
                      {expandedNotesId === application.id && (
                        <div className="mt-3 rounded-lg border border-teal/20 bg-gradient-to-br from-teal/5 to-teal/2 p-5">
                          <h4 className="mb-4 text-sm font-bold text-slate">Notes for {application.companyName}</h4>

                          {/* Notes List */}
                          {loadingNotes ? (
                            <div className="text-sm text-muted mb-4">Loading notes...</div>
                          ) : (notes[application.id] || []).length === 0 ? (
                            <div className="text-sm text-muted mb-4 italic">No notes yet. Create one below.</div>
                          ) : (
                            <div className="space-y-3 mb-4">
                              {(notes[application.id] || []).map((note) => (
                                <div key={note.id} className="rounded-lg border border-teal/10 bg-white p-3 text-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-charcoal flex-1">{note.noteText}</p>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNote(application.id, note.id)}
                                      disabled={savingNote}
                                      className="text-xs font-bold text-red-600 hover:text-red-800 transition flex-shrink-0"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="mt-2 text-xs text-muted">
                                    {formatDate(note.createdAt)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Note Form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newNoteText}
                              onChange={(event) => setNewNoteText(event.target.value)}
                              placeholder="Add a note..."
                              disabled={savingNote}
                              className="flex-1 rounded-lg border border-teal/20 bg-white px-3 py-2 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/10 disabled:opacity-60 placeholder:text-muted/50"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddNote(application.id)}
                              disabled={savingNote || !newNoteText.trim()}
                              className="rounded-lg bg-gradient-to-r from-teal to-teal px-4 py-2 text-xs font-bold text-white transition hover:shadow-md-soft disabled:cursor-not-allowed disabled:opacity-60 shadow-sm-soft"
                            >
                              {savingNote ? "..." : "Add"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate/10 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted">
                  Showing {applications.length} of {total} applications
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate/70">
                    Page Size
                    <select
                      value={pageSize}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                      className="rounded-lg border border-slate/15 bg-white px-2 py-1.5 text-xs text-charcoal"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || loading}
                    className="rounded-lg border border-slate/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted transition hover:bg-slate/5 hover:text-slate disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>

                  <span className="text-xs font-bold uppercase tracking-wider text-slate/70">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || loading}
                    className="rounded-lg border border-slate/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted transition hover:bg-slate/5 hover:text-slate disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
