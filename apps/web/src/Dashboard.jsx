import { useEffect, useMemo, useRef, useState } from "react";
import { APPLICATION_STATUSES } from "@jat/shared";
import { useAuth } from "./hooks/useAuth";
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  setAuthToken as setAppAuthToken,
  updateApplication,
} from "./services/applications-api.js";
import {
  createNote,
  fetchNotes,
  setAuthToken as setNotesAuthToken,
  updateNote,
} from "./services/notes-api.js";

const STATUS_LABELS = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_CLASSES = {
  applied: "status-applied",
  interview: "status-interview",
  offer: "status-offer",
  rejected: "status-rejected",
};

const SORT_OPTIONS = [
  { value: "updatedAt", label: "Updated" },
  { value: "appliedAt", label: "Applied Date" },
  { value: "createdAt", label: "Created" },
  { value: "companyName", label: "Company" },
  { value: "status", label: "Status" },
];

const AVATAR_COLORS = ["#E8F0FF", "#FFF3E4", "#E8F8EF", "#F5EEFF", "#FFF0F4", "#EDF7FA"];

const DEFAULT_IMPORT_DRAFT = {
  companyName: "",
  positionTitle: "",
  location: "",
  applicationUrl: "",
  status: "applied",
  appliedAt: "",
  remotePolicy: "",
  salaryRange: "",
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

function toTitleWords(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildCompanyFromHost(hostname) {
  const segments = hostname.split(".").filter(Boolean);
  const root = segments[0] || "";
  return toTitleWords(root.replace(/\d+/g, "")) || "Unknown Company";
}

function buildRoleFromPath(pathname) {
  const parts = pathname
    .split("/")
    .map((part) => decodeURIComponent(part.trim()))
    .filter(Boolean)
    .filter((part) => !["jobs", "job", "careers", "positions", "openings"].includes(part.toLowerCase()));

  if (!parts.length) {
    return "Unknown Role";
  }

  return toTitleWords(parts[0]);
}

function parseImportInput(rawInput) {
  const input = rawInput.trim();

  if (!input) {
    throw new Error("Paste a job URL, job text, or company name first.");
  }

  const today = new Date().toISOString().slice(0, 10);

  if (/^https?:\/\//i.test(input)) {
    const url = new URL(input);
    return {
      ...DEFAULT_IMPORT_DRAFT,
      companyName: buildCompanyFromHost(url.hostname),
      positionTitle: buildRoleFromPath(url.pathname),
      location: "",
      applicationUrl: input,
      appliedAt: today,
    };
  }

  const lines = input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] || input;
  const roleMatch = input.match(/(?:for|as)\s+([A-Za-z0-9\-\s\/]{3,80})/i);
  const companyMatch = input.match(/(?:at|with)\s+([A-Za-z0-9&\-\s]{2,60})/i);

  return {
    ...DEFAULT_IMPORT_DRAFT,
    companyName: companyMatch?.[1]?.trim() || toTitleWords(firstLine.split(" ").slice(0, 3).join(" ")),
    positionTitle: roleMatch?.[1]?.trim() || "Unknown Role",
    appliedAt: today,
  };
}

function normalizePayload(value) {
  return {
    companyName: value.companyName.trim(),
    positionTitle: value.positionTitle.trim(),
    location: value.location?.trim() || "",
    applicationUrl: value.applicationUrl?.trim() || "",
    status: value.status,
    appliedAt: value.appliedAt || "",
  };
}

function daysBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function getQueryAppId() {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("app");
}

function setQueryAppId(applicationId) {
  const url = new URL(window.location.href);
  if (applicationId) {
    url.searchParams.set("app", applicationId);
  } else {
    url.searchParams.delete("app");
  }
  window.history.replaceState({}, "", url);
}

function highlightText(text, searchQuery) {
  if (!text) {
    return "";
  }

  const query = searchQuery.trim();
  if (!query) {
    return text;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = String(text).split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark className="hit-mark" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function hashToIndex(value, max) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

function getInitials(name) {
  const parts = (name || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return "NA";
  }

  return `${parts[0][0] || ""}${parts[1]?.[0] || parts[0][1] || ""}`.toUpperCase();
}

function getLogoUrl(applicationUrl) {
  if (!applicationUrl) {
    return null;
  }

  try {
    const { hostname } = new URL(applicationUrl);
    return `https://logo.clearbit.com/${hostname}`;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [importInput, setImportInput] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importDraft, setImportDraft] = useState(null);
  const [importError, setImportError] = useState("");

  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [focusedApplicationId, setFocusedApplicationId] = useState(null);
  const [statusPopoverAppId, setStatusPopoverAppId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [animatedBadgeId, setAnimatedBadgeId] = useState(null);
  const [logoFallbackMap, setLogoFallbackMap] = useState({});

  const [notesByApp, setNotesByApp] = useState({});
  const [detailNoteText, setDetailNoteText] = useState("");
  const [detailNoteId, setDetailNoteId] = useState(null);
  const [noteStatus, setNoteStatus] = useState("idle");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "1");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("dashboardViewMode") || "list");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [pipelineExpandedMobile, setPipelineExpandedMobile] = useState(false);
  const [searchHintVisible, setSearchHintVisible] = useState(() => localStorage.getItem("searchHintDismissed") !== "1");

  const importInputRef = useRef(null);
  const importSectionRef = useRef(null);
  const searchInputRef = useRef(null);
  const notesTextRef = useRef(null);
  const noteBaselineRef = useRef("");
  const noteTimerRef = useRef(null);
  const touchStartYRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("dashboardViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 640);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (token) {
      setAppAuthToken(token);
      setNotesAuthToken(token);
    }
  }, [token]);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) || null,
    [applications, selectedApplicationId]
  );

  const groupedForKanban = useMemo(() => {
    const base = {
      applied: [],
      interview: [],
      offer: [],
      rejected: [],
    };

    applications.forEach((application) => {
      base[application.status].push(application);
    });

    return base;
  }, [applications]);

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const result = await fetchApplications({
        q: searchText.trim(),
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      const nextApps = result.data?.applications || [];
      setApplications(nextApps);
      setTotal(result.meta?.pagination?.total || 0);
      setTotalPages(result.meta?.pagination?.totalPages || 1);

      const requestedId = getQueryAppId();
      if (requestedId && nextApps.some((application) => application.id === requestedId)) {
        setSelectedApplicationId(requestedId);
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load applications.");
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

  useEffect(() => {
    function closeFloatingMenus(event) {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-floating-menu]")) {
        return;
      }
      setContextMenu(null);
      setStatusPopoverAppId(null);
    }

    window.addEventListener("click", closeFloatingMenus);
    return () => window.removeEventListener("click", closeFloatingMenus);
  }, []);

  useEffect(() => {
    if (!selectedApplicationId) {
      setDetailNoteText("");
      setDetailNoteId(null);
      noteBaselineRef.current = "";
      return;
    }

    async function loadDetailNotes() {
      try {
        const data = await fetchNotes(selectedApplicationId);
        const loadedNotes = data.notes || [];
        setNotesByApp((prev) => ({ ...prev, [selectedApplicationId]: loadedNotes }));

        const latest = loadedNotes[0] || null;
        setDetailNoteText(latest?.noteText || "");
        setDetailNoteId(latest?.id || null);
        noteBaselineRef.current = latest?.noteText || "";
      } catch (noteError) {
        setError(noteError.message || "Failed to load notes.");
      }
    }

    loadDetailNotes();
  }, [selectedApplicationId]);

  useEffect(() => {
    if (!selectedApplicationId) {
      return;
    }

    if (detailNoteText === noteBaselineRef.current) {
      return;
    }

    if (noteTimerRef.current) {
      clearTimeout(noteTimerRef.current);
    }

    setNoteStatus("saving");

    noteTimerRef.current = setTimeout(async () => {
      try {
        if (detailNoteId) {
          const data = await updateNote(detailNoteId, { noteText: detailNoteText });
          const savedNote = data.note;

          setNotesByApp((prev) => {
            const nextList = (prev[selectedApplicationId] || []).map((note) =>
              note.id === detailNoteId ? savedNote : note
            );
            return { ...prev, [selectedApplicationId]: nextList };
          });

          noteBaselineRef.current = savedNote.noteText;
        } else if (detailNoteText.trim()) {
          const data = await createNote(selectedApplicationId, { noteText: detailNoteText });
          const savedNote = data.note;

          setDetailNoteId(savedNote.id);
          setNotesByApp((prev) => {
            const nextList = [savedNote, ...(prev[selectedApplicationId] || [])];
            return { ...prev, [selectedApplicationId]: nextList };
          });

          noteBaselineRef.current = savedNote.noteText;
        }

        setNoteStatus("saved");
        setTimeout(() => setNoteStatus("idle"), 1000);
      } catch (noteError) {
        setNoteStatus("error");
        setError(noteError.message || "Failed to save note.");
      }
    }, 500);

    return () => {
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
    };
  }, [detailNoteText, detailNoteId, selectedApplicationId]);

  useEffect(() => {
    function isTypingContext(target) {
      return target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    }

    function handleKeyDown(event) {
      if ((event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) && !isTypingContext(event.target)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setSearchHintVisible(false);
        localStorage.setItem("searchHintDismissed", "1");
        return;
      }

      const activeRows = applications;
      if (!activeRows.length || isTypingContext(event.target)) {
        return;
      }

      const currentIndex = activeRows.findIndex((item) => item.id === (focusedApplicationId || selectedApplicationId));

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = activeRows[Math.min(activeRows.length - 1, Math.max(0, currentIndex + 1))];
        if (next) {
          setFocusedApplicationId(next.id);
        }
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const next = activeRows[Math.max(0, currentIndex - 1)];
        if (next) {
          setFocusedApplicationId(next.id);
        }
      }

      if (event.key === "Enter" && focusedApplicationId) {
        event.preventDefault();
        openDetails(focusedApplicationId);
      }

      if (event.key === "Escape") {
        closeDetails();
      }

      if (event.key.toLowerCase() === "s" && focusedApplicationId) {
        event.preventDefault();
        setStatusPopoverAppId((prev) => (prev === focusedApplicationId ? null : focusedApplicationId));
      }

      if (event.key.toLowerCase() === "n" && selectedApplicationId) {
        event.preventDefault();
        notesTextRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [applications, focusedApplicationId, selectedApplicationId]);

  const metrics = useMemo(() => {
    const counts = APPLICATION_STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      { applied: 0, interview: 0, offer: 0, rejected: 0 }
    );

    let responseDaysTotal = 0;
    let responseDaysCount = 0;

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    let currentWeek = 0;
    let previousWeek = 0;

    applications.forEach((application) => {
      counts[application.status] += 1;

      if (application.appliedAt && application.statusChangedAt && ["interview", "offer", "rejected"].includes(application.status)) {
        responseDaysTotal += daysBetween(application.appliedAt, application.statusChangedAt);
        responseDaysCount += 1;
      }

      const createdAt = new Date(application.createdAt).getTime();
      if (now - createdAt <= sevenDaysMs) {
        currentWeek += 1;
      } else if (now - createdAt <= sevenDaysMs * 2) {
        previousWeek += 1;
      }
    });

    const visibleTotal = applications.length;
    const responseRate = visibleTotal ? Math.round(((counts.interview + counts.offer) / visibleTotal) * 100) : 0;
    const avgDaysToFirstResponse = responseDaysCount ? Math.round(responseDaysTotal / responseDaysCount) : null;
    const activeApplications = visibleTotal - counts.rejected;

    let trend = "flat";
    if (currentWeek > previousWeek) {
      trend = "up";
    } else if (currentWeek < previousWeek) {
      trend = "down";
    }

    return {
      counts,
      responseRate,
      avgDaysToFirstResponse,
      activeApplications,
      trend,
      currentWeek,
      previousWeek,
    };
  }, [applications]);

  function toggleSegmentFilter(status) {
    setStatusFilter((prev) => (prev === status ? "all" : status));
  }

  async function handleImportExtract(event) {
    event.preventDefault();
    setImportError("");
    setImportLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const parsed = parseImportInput(importInput);
      setImportDraft(parsed);
    } catch (extractError) {
      setImportError(extractError.message || "Unable to parse input.");
    } finally {
      setImportLoading(false);
    }
  }

  async function optimisticCreateApplication(payload) {
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimistic = {
      id: tempId,
      ...payload,
      createdAt: nowIso,
      updatedAt: nowIso,
      statusChangedAt: nowIso,
    };

    setApplications((prev) => [optimistic, ...prev]);
    setTotal((prev) => prev + 1);

    try {
      const data = await createApplication(payload);
      const created = data.application;

      setApplications((prev) => prev.map((application) => (application.id === tempId ? created : application)));
      return created;
    } catch (createError) {
      setApplications((prev) => prev.filter((application) => application.id !== tempId));
      setTotal((prev) => Math.max(0, prev - 1));
      throw createError;
    }
  }

  async function handleImportSave() {
    if (!importDraft) {
      return;
    }

    const payload = normalizePayload(importDraft);

    if (!payload.companyName || !payload.positionTitle) {
      setImportError("Company name and position title are required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await optimisticCreateApplication(payload);
      setMessage("Application added from import.");
      setImportDraft(null);
      setImportInput("");
    } catch (saveError) {
      setError(saveError.message || "Failed to create application.");
    } finally {
      setSaving(false);
    }
  }

  async function optimisticDeleteApplication(application) {
    const previous = applications;

    setApplications((prev) => prev.filter((item) => item.id !== application.id));
    setTotal((prev) => Math.max(0, prev - 1));

    if (selectedApplicationId === application.id) {
      setSelectedApplicationId(null);
      setQueryAppId(null);
    }

    try {
      await deleteApplication(application.id);
      setMessage("Application deleted.");
    } catch (deleteError) {
      setApplications(previous);
      setTotal((prev) => prev + 1);
      throw deleteError;
    }
  }

  async function handleDelete(application) {
    const confirmed = window.confirm(`Delete application for ${application.companyName}?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await optimisticDeleteApplication(application);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete application.");
    } finally {
      setSaving(false);
      setContextMenu(null);
    }
  }

  async function optimisticStatusChange(application, nextStatus) {
    const previousStatus = application.status;

    if (previousStatus === nextStatus) {
      return;
    }

    setApplications((prev) =>
      prev.map((item) =>
        item.id === application.id
          ? {
              ...item,
              status: nextStatus,
              statusChangedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

    setAnimatedBadgeId(application.id);
    setTimeout(() => setAnimatedBadgeId(null), 280);

    try {
      const data = await updateApplication(application.id, { status: nextStatus });
      setApplications((prev) =>
        prev.map((item) => (item.id === application.id ? data.application : item))
      );

      if (nextStatus === "interview") {
        setMessage("Status updated to Interview. Want to set a prep reminder next?");
      } else if (nextStatus === "offer") {
        setMessage("Status updated to Offer. Add offer details when ready.");
      } else if (nextStatus === "rejected") {
        setMessage("Noted - on to the next one.");
      } else {
        setMessage("Status updated.");
      }
    } catch (statusError) {
      setApplications((prev) =>
        prev.map((item) => (item.id === application.id ? { ...item, status: previousStatus } : item))
      );
      setError(statusError.message || "Failed to update status.");
    }
  }

  function openDetails(applicationId) {
    setSelectedApplicationId(applicationId);
    setFocusedApplicationId(applicationId);
    setQueryAppId(applicationId);
  }

  function closeDetails() {
    setSelectedApplicationId(null);
    setQueryAppId(null);
  }

  function staleDays(application) {
    if (!application.statusChangedAt) {
      return null;
    }

    return daysBetween(application.statusChangedAt, new Date().toISOString());
  }

  function activateQuickAddFromSearch() {
    const q = searchText.trim();
    if (!q) {
      return;
    }

    setImportDraft({
      ...DEFAULT_IMPORT_DRAFT,
      companyName: toTitleWords(q),
      positionTitle: "Unknown Role",
      appliedAt: new Date().toISOString().slice(0, 10),
    });

    importSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => importInputRef.current?.focus(), 250);
  }

  function renderAvatar(application) {
    const logoUrl = getLogoUrl(application.applicationUrl);
    const initials = getInitials(application.companyName);
    const fallbackKey = logoUrl || `${application.id}-fallback`;
    const useFallback = !logoUrl || logoFallbackMap[fallbackKey];
    const bg = AVATAR_COLORS[hashToIndex(application.companyName || application.id, AVATAR_COLORS.length)];

    return (
      <div className="company-avatar" style={{ backgroundColor: bg }}>
        {!useFallback ? (
          <img
            src={logoUrl}
            alt={`${application.companyName} logo`}
            onError={() => setLogoFallbackMap((prev) => ({ ...prev, [fallbackKey]: true }))}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }

  function renderApplicationCard(application) {
    const stale = staleDays(application);
    const isStale = stale !== null && stale > 14;
    const selected = selectedApplicationId === application.id;
    const focused = focusedApplicationId === application.id;

    return (
      <article
        key={application.id}
        className={`application-row row-anim ${selected ? "row-selected" : ""} ${isStale ? "row-stale" : ""} ${focused ? "row-focused" : ""}`}
        onClick={() => openDetails(application.id)}
        onFocus={() => setFocusedApplicationId(application.id)}
        onContextMenu={(event) => {
          event.preventDefault();
          setContextMenu({ x: event.clientX, y: event.clientY, appId: application.id });
        }}
        tabIndex={0}
      >
        <div className="row-main">
          {renderAvatar(application)}
          <div>
            <p className="company-title company-display">{highlightText(application.companyName, searchText)}</p>
            <p className="role-text">{highlightText(application.positionTitle, searchText)}</p>
            <div className="meta-line">
              <span>{highlightText(application.location || "Unknown location", searchText)}</span>
              <span className="mono-text">Applied {formatDate(application.appliedAt)}</span>
              <span className="mono-text">Updated {formatDate(application.updatedAt)}</span>
              {isStale ? <span className="attention-dot">Needs attention</span> : null}
            </div>
            <div className="shortcut-hint">Enter: open, S: status, N: notes</div>
          </div>
        </div>

        <div className="row-right" data-floating-menu>
          <div className="row-hover-actions">
            <button type="button" className="icon-btn" onClick={(event) => { event.stopPropagation(); openDetails(application.id); }} aria-label="Open details">
              ✎
            </button>
            {application.applicationUrl ? (
              <a
                href={application.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="icon-btn"
                aria-label="Open job URL"
                onClick={(event) => event.stopPropagation()}
              >
                ↗
              </a>
            ) : null}
          </div>

          <button
            type="button"
            className={`status-pill ${STATUS_CLASSES[application.status]} ${animatedBadgeId === application.id ? "status-pop" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              setStatusPopoverAppId((prev) => (prev === application.id ? null : application.id));
            }}
          >
            {STATUS_LABELS[application.status]}
          </button>

          {statusPopoverAppId === application.id && (
            <div className="status-menu" data-floating-menu>
              {APPLICATION_STATUSES.map((status) => (
                <button
                  type="button"
                  key={status}
                  className="status-menu-item"
                  onClick={(event) => {
                    event.stopPropagation();
                    setStatusPopoverAppId(null);
                    optimisticStatusChange(application, status);
                  }}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
              <hr />
              <button
                type="button"
                className="status-menu-item danger"
                onClick={(event) => {
                  event.stopPropagation();
                  setStatusPopoverAppId(null);
                  handleDelete(application);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  function renderDetailContent() {
    const drawerNotes = notesByApp[selectedApplicationId] || [];

    if (!selectedApplication) {
      return <div className="empty-state">Select an application to open split-pane details.</div>;
    }

    return (
      <>
        <div className="panel-header">
          <h2>{selectedApplication.companyName}</h2>
          <button type="button" className="btn btn-subtle" onClick={closeDetails}>Close</button>
        </div>

        <p className="company-title company-display">{selectedApplication.positionTitle}</p>
        <div className="meta-pills">
          <span className="meta-pill">{selectedApplication.location || "Location TBD"}</span>
          <span className="meta-pill">{selectedApplication.applicationUrl ? "External link" : "No source URL"}</span>
          <span className="meta-pill mono-text">Applied {formatDate(selectedApplication.appliedAt)}</span>
        </div>

        <section className="stack-sm">
          <h3>Timeline</h3>
          <ul className="timeline">
            <li>Created - {formatDate(selectedApplication.createdAt)}</li>
            <li>Status changed - {formatDate(selectedApplication.statusChangedAt)}</li>
            <li>Last updated - {formatDate(selectedApplication.updatedAt)}</li>
            {drawerNotes.slice(0, 3).map((note) => (
              <li key={note.id}>Note added - {formatDate(note.createdAt)}</li>
            ))}
          </ul>
        </section>

        <section className="stack-sm">
          <h3>Notes (autosave)</h3>
          <textarea
            ref={notesTextRef}
            className="input"
            rows={6}
            value={detailNoteText}
            onChange={(event) => setDetailNoteText(event.target.value)}
            placeholder="Add interview prep, recruiter updates, and follow-up notes"
          />
          <p className="muted-text">
            {noteStatus === "saving" ? "Saving..." : noteStatus === "saved" ? "Saved" : noteStatus === "error" ? "Failed to save" : ""}
          </p>
        </section>

        {selectedApplication.status === "offer" && (
          <section className="stack-sm">
            <h3>Offer Details</h3>
            <p className="muted-text">Base, bonus, equity, and vesting details will be tracked here in Phase 7.</p>
          </section>
        )}

        <section className="stack-sm">
          <h3>Contacts</h3>
          <p className="muted-text">Recruiter, hiring manager, and referral tracking placeholder for upcoming CRM-lite flow.</p>
        </section>
      </>
    );
  }

  const showSearchEmpty = !loading && applications.length === 0 && searchText.trim().length > 0;
  const showFirstRunEmpty = !loading && total === 0 && !searchText.trim();

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <button type="button" className="sidebar-toggle" onClick={() => setSidebarCollapsed((prev) => !prev)}>
          {sidebarCollapsed ? "»" : "«"}
        </button>

        <nav className="sidebar-nav">
          <button type="button" className="nav-item active" title="Dashboard">▦ {!sidebarCollapsed && <span>Dashboard</span>}</button>
          <button type="button" className="nav-item" title="Board" onClick={() => setViewMode("kanban")}>☰ {!sidebarCollapsed && <span>Board</span>}</button>
          <button type="button" className="nav-item" title="Offers">✦ {!sidebarCollapsed && <span>Offers</span>}</button>
          <button type="button" className="nav-item" title="Settings">⚙ {!sidebarCollapsed && <span>Settings</span>}</button>
        </nav>
      </aside>

      <main className="app-content">
        <header className="app-header">
          <div>
            <h1 className="app-title company-display">Opportunity Command Center</h1>
            <p className="app-subtitle">Fast import, instant status updates, and a split-pane workflow.</p>
          </div>
          <div className="app-user-actions">
            <span className="muted-text">{user?.email}</span>
            <button type="button" className="btn btn-subtle" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {(message || error || importError) && (
          <div className="stack-sm">
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}
            {importError && <div className="alert alert-error">{importError}</div>}
          </div>
        )}

        <section className="panel" id="pipeline-health">
          <div className="panel-header">
            <h2>Pipeline Health</h2>
            <div className="trend-text">
              {metrics.trend === "up" ? "▲" : metrics.trend === "down" ? "▼" : "•"} This week {metrics.currentWeek} vs last week {metrics.previousWeek}
            </div>
          </div>

          <div className="pipeline-bar" role="img" aria-label="Application status distribution">
            {APPLICATION_STATUSES.map((status) => {
              const count = metrics.counts[status];
              const denominator = applications.length || 1;
              const width = Math.max(6, (count / denominator) * 100);
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  className={`pipeline-segment ${STATUS_CLASSES[status]} ${active ? "segment-active" : ""}`}
                  style={{ width: `${width}%` }}
                  onClick={() => toggleSegmentFilter(status)}
                  title={`${STATUS_LABELS[status]} (${count})`}
                >
                  <span>{STATUS_LABELS[status]} {count}</span>
                </button>
              );
            })}
          </div>

          {(!isMobile || pipelineExpandedMobile) && (
            <div className="metric-grid metrics-animated">
              <div>
                <p className="metric-label">Response Rate</p>
                <p className="metric-value mono-text">{metrics.responseRate}%</p>
              </div>
              <div>
                <p className="metric-label">Avg Days To First Response</p>
                <p className="metric-value mono-text">{metrics.avgDaysToFirstResponse ?? "-"}</p>
              </div>
              <div>
                <p className="metric-label">Active Applications</p>
                <p className="metric-value mono-text">{metrics.activeApplications}</p>
              </div>
            </div>
          )}

          {isMobile && (
            <button type="button" className="btn btn-subtle" onClick={() => setPipelineExpandedMobile((prev) => !prev)}>
              {pipelineExpandedMobile ? "Collapse pipeline details" : "Expand pipeline details"}
            </button>
          )}
        </section>

        <section ref={importSectionRef} className="panel">
          <div className="panel-header">
            <h2>Quick Import</h2>
            <span className="muted-text">From 09.md 5A: always visible import bar</span>
          </div>

          <form onSubmit={handleImportExtract} className="import-form">
            <input
              ref={importInputRef}
              value={importInput}
              onChange={(event) => setImportInput(event.target.value)}
              placeholder="Paste job URL, job text, or company name"
              className={`input ${importLoading ? "input-loading" : ""}`}
            />
            <button type="submit" className="btn btn-primary" disabled={importLoading}>
              {importLoading ? "Extracting..." : "Extract"}
            </button>
          </form>

          {importDraft && (
            <div className="import-draft">
              <div className="grid-two">
                <label>
                  Company
                  <input
                    className="input"
                    value={importDraft.companyName}
                    onChange={(event) => setImportDraft({ ...importDraft, companyName: event.target.value })}
                  />
                </label>
                <label>
                  Role
                  <input
                    className="input"
                    value={importDraft.positionTitle}
                    onChange={(event) => setImportDraft({ ...importDraft, positionTitle: event.target.value })}
                  />
                </label>
                <label>
                  Status
                  <select
                    className="input"
                    value={importDraft.status}
                    onChange={(event) => setImportDraft({ ...importDraft, status: event.target.value })}
                  >
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Applied Date
                  <input
                    type="date"
                    className="input"
                    value={importDraft.appliedAt}
                    onChange={(event) => setImportDraft({ ...importDraft, appliedAt: event.target.value })}
                  />
                </label>
                <label>
                  Location
                  <input
                    className="input"
                    value={importDraft.location}
                    onChange={(event) => setImportDraft({ ...importDraft, location: event.target.value })}
                  />
                </label>
                <label>
                  URL
                  <input
                    className="input"
                    value={importDraft.applicationUrl}
                    onChange={(event) => setImportDraft({ ...importDraft, applicationUrl: event.target.value })}
                  />
                </label>
              </div>

              <div className="row-actions">
                <button type="button" className="btn btn-subtle" onClick={() => setImportDraft(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleImportSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Application"}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="main-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Applications</h2>
              <div className="row-actions">
                <div className="view-toggle" role="tablist" aria-label="View mode">
                  <button type="button" className={`btn btn-subtle ${viewMode === "list" ? "active-toggle" : ""}`} onClick={() => setViewMode("list")}>List</button>
                  <button type="button" className={`btn btn-subtle ${viewMode === "kanban" ? "active-toggle" : ""}`} onClick={() => setViewMode("kanban")}>Kanban</button>
                </div>
                <button type="button" className="btn btn-subtle" onClick={loadApplications}>Refresh</button>
              </div>
            </div>

            <div className="filter-grid">
              <div className="search-wrap">
                <input
                  ref={searchInputRef}
                  className="input"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search company, role, location, notes"
                />
                {searchHintVisible && <span className="search-hint">⌘K or / to search</span>}
              </div>
              <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
              <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select className="input" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {loading ? (
              <div className="empty-state">Loading applications...</div>
            ) : showFirstRunEmpty ? (
              <div className="empty-state first-run-empty">
                <h3>Paste your first job URL to get started</h3>
                <p>Try one of these examples:</p>
                <div className="row-actions">
                  {[
                    "https://jobs.lever.co/stripe/frontend-engineer",
                    "https://www.notion.so/careers/product-designer",
                    "https://jobs.ashbyhq.com/vercel/software-engineer",
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="btn btn-subtle"
                      onClick={() => {
                        setImportInput(example);
                        importSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        setTimeout(() => importInputRef.current?.focus(), 250);
                      }}
                    >
                      Example URL
                    </button>
                  ))}
                </div>
              </div>
            ) : showSearchEmpty ? (
              <div className="empty-state">
                <p>No applications matching "{searchText}".</p>
                <button type="button" className="btn btn-primary" onClick={activateQuickAddFromSearch}>
                  Quick add "{searchText}"
                </button>
              </div>
            ) : viewMode === "list" ? (
              <div className="application-list list-transition">
                {applications.map(renderApplicationCard)}
              </div>
            ) : (
              <div className="kanban-grid">
                {APPLICATION_STATUSES.map((status) => (
                  <section key={status} className="kanban-column">
                    <h3>{STATUS_LABELS[status]}</h3>
                    <div className="kanban-stack">
                      {groupedForKanban[status].length === 0 ? (
                        <div className="kanban-empty">No items</div>
                      ) : (
                        groupedForKanban[status].map(renderApplicationCard)
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="pagination-row">
              <span className="muted-text">Showing {applications.length} of {total}</span>
              <div className="row-actions">
                <select className="input input-small" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button type="button" className="btn btn-subtle" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Prev</button>
                <span className="muted-text mono-text">Page {page} / {totalPages}</span>
                <button type="button" className="btn btn-subtle" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</button>
              </div>
            </div>
          </section>

          {!isMobile && <aside className="panel detail-drawer">{renderDetailContent()}</aside>}
        </div>
      </main>

      {isMobile && selectedApplication && (
        <div className="mobile-sheet-scrim" onClick={closeDetails}>
          <div
            className="mobile-sheet"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              touchStartYRef.current = event.changedTouches[0]?.clientY || null;
            }}
            onTouchEnd={(event) => {
              const start = touchStartYRef.current;
              const end = event.changedTouches[0]?.clientY;
              if (start !== null && end - start > 80) {
                closeDetails();
              }
              touchStartYRef.current = null;
            }}
          >
            <div className="sheet-handle" />
            {renderDetailContent()}
          </div>
        </div>
      )}

      {isMobile && (
        <div className="mobile-bottom-nav">
          <button type="button" className="nav-item active">▦</button>
          <button type="button" className="nav-item" onClick={() => setViewMode("kanban")}>☰</button>
          <button type="button" className="nav-item">✦</button>
          <button type="button" className="nav-item">⚙</button>
        </div>
      )}

      {isMobile && (
        <button
          type="button"
          className="mobile-fab"
          onClick={() => {
            importSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            setTimeout(() => importInputRef.current?.focus(), 250);
          }}
        >
          +
        </button>
      )}

      {contextMenu && (
        <div
          className="status-menu context-menu"
          data-floating-menu
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {APPLICATION_STATUSES.map((status) => {
            const application = applications.find((item) => item.id === contextMenu.appId);
            if (!application) {
              return null;
            }
            return (
              <button
                type="button"
                key={status}
                className="status-menu-item"
                onClick={() => {
                  optimisticStatusChange(application, status);
                  setContextMenu(null);
                }}
              >
                {STATUS_LABELS[status]}
              </button>
            );
          })}
          <hr />
          <button
            type="button"
            className="status-menu-item danger"
            onClick={() => {
              const application = applications.find((item) => item.id === contextMenu.appId);
              if (application) {
                handleDelete(application);
              }
              setContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
