import { useEffect, useMemo, useRef, useState } from "react";
import { APPLICATION_STATUSES } from "@jat/shared";
import { useAuth } from "./hooks/useAuth";
import { CompensationForm } from "./CompensationForm";
import {
  createApplication,
  deleteApplication,
  extractFromUrl,
  fetchApplications,
  setAuthToken as setAppAuthToken,
  updateApplication,
} from "./services/applications-api.js";
import { ExtractionPreview } from "./components/ExtractionPreview.jsx";
import {
  createNote,
  fetchNotes,
  setAuthToken as setNotesAuthToken,
  updateNote,
} from "./services/notes-api.js";
import {
  fetchCompensation,
  setAuthToken as setCompensationAuthToken,
} from "./services/compensation-api.js";
import {
  createApplicationEvent,
  deleteApplicationEvent,
  fetchApplicationEvents,
  setAuthToken as setEventsAuthToken,
  updateApplicationEvent,
} from "./services/events-api.js";
import { getAuthProfile, getGoogleLinkUrl } from "./services/auth-api";
import { AppMobileNav, AppSidebar } from "./components/AppNavigation.jsx";
import {
  appDateTimeLocalToIso,
  formatDateInAppTimeZone,
  formatDateTimeInAppTimeZone,
  getAppDateKey,
  getAppDayDifference,
  toDateTimeLocalValueInAppTimeZone,
} from "./utils/app-timezone.js";

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

const AVATAR_COLORS = ["#2A2018", "#2A1C1A", "#1F2520", "#251D23", "#2D1C1E", "#1D2427"];

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

const EMPTY_EVENT_FORM = {
  title: "Interview",
  startsAt: "",
  endsAt: "",
  notes: "",
};

function formatDate(value) {
  return formatDateInAppTimeZone(value);
}

function formatDateTime(value) {
  return formatDateTimeInAppTimeZone(value);
}

function toDateTimeLocalValue(value) {
  return toDateTimeLocalValueInAppTimeZone(value);
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

function findFirstUrl(rawInput) {
  const match = rawInput.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

function parseImportInput(rawInput) {
  const input = rawInput.trim();

  if (!input) {
    throw new Error("Paste a job URL, job text, or company name first.");
  }

  const today = getAppDateKey();

  const detectedUrl = findFirstUrl(input);

  if (detectedUrl) {
    const url = new URL(detectedUrl);
    return {
      ...DEFAULT_IMPORT_DRAFT,
      companyName: buildCompanyFromHost(url.hostname),
      positionTitle: buildRoleFromPath(url.pathname),
      location: "",
      applicationUrl: detectedUrl,
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
  const looksLikePlainCompanyName = lines.length === 1 && !roleMatch && !companyMatch;

  return {
    ...DEFAULT_IMPORT_DRAFT,
    companyName: looksLikePlainCompanyName ? input : companyMatch?.[1]?.trim() || firstLine,
    positionTitle: roleMatch?.[1]?.trim() || "",
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
  return getAppDayDifference(start, end);
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

function buildCacheKey(query) {
  return `applications_cache_v2:${JSON.stringify(query)}`;
}

function escapeCsvValue(value) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildCsv(applications, notesByApp) {
  const headers = [
    "id",
    "companyName",
    "positionTitle",
    "status",
    "location",
    "applicationUrl",
    "appliedAt",
    "createdAt",
    "updatedAt",
    "statusChangedAt",
    "notes",
  ];

  const rows = applications.map((application) => {
    const notes = (notesByApp[application.id] || []).map((note) => note.noteText).join(" | ");
    return [
      application.id,
      application.companyName,
      application.positionTitle,
      application.status,
      application.location,
      application.applicationUrl,
      application.appliedAt,
      application.createdAt,
      application.updatedAt,
      application.statusChangedAt,
      notes,
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}

function buildReminderCards(applications) {
  const reminders = [];

  const newestCreatedAt = applications
    .map((application) => new Date(application.createdAt).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  if (!newestCreatedAt || getAppDayDifference(new Date(newestCreatedAt)) >= 7) {
    reminders.push({
      id: "inactive-search",
      title: "Your search has been quiet",
      body: "No new applications in 7+ days. Consider setting a weekly target.",
    });
  }

  const staleInterview = applications.find(
    (application) =>
      application.status === "interview" &&
      getDaysSince(application.updatedAt || application.statusChangedAt || application.createdAt) >= 5
  );

  if (staleInterview) {
    reminders.push({
      id: "interview-stale",
      title: "Interview follow-up reminder",
      body: `No update in 5+ days for ${staleInterview.companyName}.`,
    });
  }

  const staleOffer = applications.find(
    (application) =>
      application.status === "offer" &&
      getDaysSince(application.updatedAt || application.statusChangedAt || application.createdAt) >= 10
  );

  if (staleOffer) {
    reminders.push({
      id: "offer-stale",
      title: "Offer decision reminder",
      body: `${staleOffer.companyName} offer has had no updates for 10+ days.`,
    });
  }

  return reminders;
}

function getDaysSince(value) {
  return getAppDayDifference(value);
}

function isFollowUpCandidate(application) {
  const idleDays = getDaysSince(application.updatedAt || application.statusChangedAt || application.createdAt);

  if (application.status === "interview") {
    return idleDays >= 5;
  }

  if (application.status === "applied") {
    return idleDays >= 7;
  }

  return false;
}

function matchesFocusMode(application, focusMode) {
  if (!focusMode) {
    return true;
  }

  const ageDays = getDaysSince(application.createdAt || application.appliedAt);

  switch (focusMode) {
    case "follow-ups":
      return isFollowUpCandidate(application);
    case "stale-interviews":
      return application.status === "interview" && isFollowUpCandidate(application);
    case "active-pipeline":
      return application.status !== "rejected";
    case "created-today":
      return getDaysSince(application.createdAt) === 0;
    case "aging-7-13":
      return application.status !== "rejected" && ageDays >= 7 && ageDays < 14;
    case "aging-14-20":
      return application.status !== "rejected" && ageDays >= 14 && ageDays < 21;
    case "aging-21-plus":
    case "aging-14-plus":
      return application.status !== "rejected" && ageDays >= 14;
    default:
      return true;
  }
}

function getFocusModeMeta(focusMode) {
  switch (focusMode) {
    case "follow-ups":
      return {
        title: "Follow-Up Review",
        body: "Showing applications that have gone quiet long enough to deserve a follow-up.",
      };
    case "stale-interviews":
      return {
        title: "Interview Follow-Ups",
        body: "These interview-stage applications have had no updates for at least 5 days.",
      };
    case "active-pipeline":
      return {
        title: "Active Pipeline",
        body: "Showing all non-rejected opportunities still in motion.",
      };
    case "created-today":
      return {
        title: "Applications Added Today",
        body: "This view isolates the opportunities you captured in Daarkin today.",
      };
    case "aging-7-13":
      return {
        title: "1-Week Aging Bucket",
        body: "Applications captured 7 to 13 days ago. A good moment to reassess or follow up.",
      };
    case "aging-14-20":
      return {
        title: "2-Week Aging Bucket",
        body: "Applications captured 14 to 20 days ago. These likely need the most attention.",
      };
    case "aging-21-plus":
      return {
        title: "3+ Week Aging Bucket",
        body: "Applications older than 3 weeks. Review whether to follow up, archive, or move on.",
      };
    case "aging-14-plus":
      return {
        title: "Aging Applications",
        body: "Showing applications that are at least 2 weeks old and worth reviewing.",
      };
    default:
      return null;
  }
}

export default function Dashboard({
  theme = "dark",
  onToggleTheme,
  onOpenHome,
  onOpenOffers,
  navigationIntent,
  onNavigationIntentConsumed,
}) {
  const { user, token, logout } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalStatusCounts, setGlobalStatusCounts] = useState({
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [focusMode, setFocusMode] = useState(null);
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

  // Phase 8: URL extraction state
  const [extractedData, setExtractedData] = useState(null);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [extractionError, setExtractionError] = useState("");

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

  const [compensationByApp, setCompensationByApp] = useState({});
  const [compensationLoadStatus, setCompensationLoadStatus] = useState("idle");
  const [eventsByApp, setEventsByApp] = useState({});
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [eventEditingId, setEventEditingId] = useState(null);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [eventStatus, setEventStatus] = useState("idle");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "1");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("dashboardViewMode") || "list");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [pipelineExpandedMobile, setPipelineExpandedMobile] = useState(false);
  const [searchHintVisible, setSearchHintVisible] = useState(() => localStorage.getItem("searchHintDismissed") !== "1");
  const [importFieldErrors, setImportFieldErrors] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingApplicationId, setEditingApplicationId] = useState(null);
  const [tourStep, setTourStep] = useState(() => {
    const completed = localStorage.getItem("dashboardTourCompleted") === "1";
    return completed ? 0 : 1;
  });
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const raw = localStorage.getItem("notificationPrefs");
    if (!raw) {
      return {
        pushEnabled: false,
        emailEnabled: true,
        noNewApps: true,
        staleInterview: true,
        staleOffer: true,
      };
    }

    try {
      return JSON.parse(raw);
    } catch {
      return {
        pushEnabled: false,
        emailEnabled: true,
        noNewApps: true,
        staleInterview: true,
        staleOffer: true,
      };
    }
  });
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [googleLinking, setGoogleLinking] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({
    loading: false,
    connected: false,
    email: null,
    connectedAt: null,
  });

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
    localStorage.setItem("notificationPrefs", JSON.stringify(notificationPrefs));
  }, [notificationPrefs]);

  useEffect(() => {
    const promptDismissed = localStorage.getItem("notificationPromptDismissed") === "1";
    setShowNotificationPrompt(applications.length >= 3 && !notificationPrefs.pushEnabled && !promptDismissed);
  }, [applications.length, notificationPrefs.pushEnabled]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("googleLinked") !== "1") {
      return;
    }

    setMessage("Google account connected successfully.");
    params.delete("googleLinked");
    const cleanQuery = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}`);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthProfile() {
      if (!token) {
        return;
      }

      setGoogleStatus((prev) => ({ ...prev, loading: true }));
      try {
        const profile = await getAuthProfile(token);
        if (cancelled) {
          return;
        }
        setGoogleStatus({
          loading: false,
          connected: profile.google.connected,
          email: profile.google.email,
          connectedAt: profile.google.connectedAt,
        });
      } catch {
        if (!cancelled) {
          setGoogleStatus((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    loadAuthProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (tourStep === 0) {
      localStorage.setItem("dashboardTourCompleted", "1");
    }
  }, [tourStep]);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 640);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setAppAuthToken(token || null);
    setNotesAuthToken(token || null);
    setCompensationAuthToken(token || null);
    setEventsAuthToken(token || null);
  }, [token]);

  useEffect(() => {
    if (!navigationIntent) {
      return;
    }

    if (navigationIntent.viewMode) {
      setViewMode(navigationIntent.viewMode);
    }

    if (navigationIntent.statusFilter) {
      setStatusFilter(navigationIntent.statusFilter);
    }

    setFocusMode(navigationIntent.focusMode || null);

    if (navigationIntent.sortBy) {
      setSortBy(navigationIntent.sortBy);
    }

    if (navigationIntent.sortOrder) {
      setSortOrder(navigationIntent.sortOrder);
    }

    if (navigationIntent.pageSize) {
      setPageSize(navigationIntent.pageSize);
    }

    if (navigationIntent.page) {
      setPage(navigationIntent.page);
    }

    if (typeof navigationIntent.importSeed === "string") {
      setImportInput(navigationIntent.importSeed);
    }

    if (navigationIntent.focusImport) {
      importSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => importInputRef.current?.focus(), 250);
    }

    onNavigationIntentConsumed?.();
  }, [navigationIntent, onNavigationIntentConsumed]);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) || null,
    [applications, selectedApplicationId]
  );

  const visibleApplications = useMemo(
    () => applications.filter((application) => matchesFocusMode(application, focusMode)),
    [applications, focusMode]
  );

  const groupedForKanban = useMemo(() => {
    const base = {
      applied: [],
      interview: [],
      offer: [],
      rejected: [],
    };

    visibleApplications.forEach((application) => {
      base[application.status].push(application);
    });

    return base;
  }, [visibleApplications]);

  const focusModeMeta = useMemo(() => getFocusModeMeta(focusMode), [focusMode]);
  const displayTotal = focusMode ? visibleApplications.length : total;
  const displayTotalPages = focusMode ? 1 : totalPages;
  const pipelineCounts = useMemo(() => {
    if (!focusMode) {
      return globalStatusCounts;
    }

    return visibleApplications.reduce(
      (counts, application) => {
        counts[application.status] += 1;
        return counts;
      },
      {
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      }
    );
  }, [focusMode, globalStatusCounts, visibleApplications]);

  async function loadApplications() {
    setLoading(true);
    setError("");

    const query = {
      q: searchText.trim(),
      status: statusFilter === "all" ? undefined : statusFilter,
      sortBy,
      sortOrder,
      page,
      pageSize,
    };

    const cacheKey = buildCacheKey(query);
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.applications)) {
          setApplications(parsed.applications);
          setTotal(parsed.total || 0);
          setTotalPages(parsed.totalPages || 1);
          setLoading(false);
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const result = await fetchApplications(query);

      const nextApps = result.data?.applications || [];
      const nextTotal = result.meta?.pagination?.total || 0;
      const nextTotalPages = result.meta?.pagination?.totalPages || 1;
      const nextStatusCounts = result.meta?.statusCounts || {
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      };

      setApplications(nextApps);
      setTotal(nextTotal);
      setTotalPages(nextTotalPages);
      setGlobalStatusCounts(nextStatusCounts);

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          applications: nextApps,
          total: nextTotal,
          totalPages: nextTotalPages,
          cachedAt: Date.now(),
        })
      );

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
    if (!selectedApplicationId) {
      return;
    }

    async function loadCompensation() {
      setCompensationLoadStatus("loading");
      try {
        const data = await fetchCompensation(selectedApplicationId);
        if (data?.data) {
          setCompensationByApp((prev) => ({ ...prev, [selectedApplicationId]: data.data }));
        }
        setCompensationLoadStatus("idle");
      } catch (error) {
        // Fail silently if compensation is not found (it's optional)
        setCompensationByApp((prev) => ({ ...prev, [selectedApplicationId]: null }));
        setCompensationLoadStatus("idle");
      }
    }

    loadCompensation();
  }, [selectedApplicationId]);

  useEffect(() => {
    if (!selectedApplicationId) {
      return;
    }

    async function loadApplicationEvents() {
      try {
        const data = await fetchApplicationEvents(selectedApplicationId);
        setEventsByApp((prev) => ({ ...prev, [selectedApplicationId]: data.events || [] }));
      } catch (eventError) {
        setError(eventError.message || "Failed to load events.");
      }
    }

    loadApplicationEvents();
  }, [selectedApplicationId]);

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
    // Use global status counts (all applications matching filters, not just current page)
    const counts = globalStatusCounts;

    // Calculate response rate based on all applications
    const totalApps = total || 0;
    const responseCount = counts.interview + counts.offer;
    const responseRate = totalApps ? Math.round((responseCount / totalApps) * 100) : 0;
    const activeApplications = totalApps - counts.rejected;

    // Calculate response days from visible applications (since we don't have full historical data)
    let responseDaysTotal = 0;
    let responseDaysCount = 0;

    applications.forEach((application) => {
      if (application.appliedAt && application.statusChangedAt && ["interview", "offer", "rejected"].includes(application.status)) {
        responseDaysTotal += daysBetween(application.appliedAt, application.statusChangedAt);
        responseDaysCount += 1;
      }
    });

    const avgDaysToFirstResponse = responseDaysCount ? Math.round(responseDaysTotal / responseDaysCount) : null;

    // Calculate trend from recent applications
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    let currentWeek = 0;
    let previousWeek = 0;

    applications.forEach((application) => {
      const createdAt = new Date(application.createdAt).getTime();
      if (now - createdAt <= sevenDaysMs) {
        currentWeek += 1;
      } else if (now - createdAt <= sevenDaysMs * 2) {
        previousWeek += 1;
      }
    });

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
  }, [globalStatusCounts, total, applications]);

  const reminderCards = useMemo(() => buildReminderCards(applications), [applications]);

  function toggleSegmentFilter(status) {
    setFocusMode(null);
    setStatusFilter((prev) => (prev === status ? "all" : status));
  }

  function clearFocusMode() {
    setFocusMode(null);
  }

  function handleNotificationPermission() {
    setNotificationPrefs((prev) => ({ ...prev, pushEnabled: true }));
    setShowNotificationPrompt(false);
    localStorage.setItem("notificationPromptDismissed", "1");
    setMessage("Push reminders enabled. You can change this anytime in Settings.");
  }

  function dismissNotificationPrompt() {
    setShowNotificationPrompt(false);
    localStorage.setItem("notificationPromptDismissed", "1");
  }

  function handleCsvExport() {
    const csv = buildCsv(applications, notesByApp);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `applications-export-${getAppDateKey()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    setMessage("CSV export downloaded.");
  }

  async function handleConnectGoogleAccount() {
    if (!token) {
      setError("You must be logged in to connect Google.");
      return;
    }

    setError("");
    setGoogleLinking(true);

    try {
      const authUrl = await getGoogleLinkUrl(token);
      window.location.assign(authUrl);
    } catch (connectError) {
      setError(connectError.message || "Failed to connect Google account.");
      setGoogleLinking(false);
    }
  }

  function nextTourStep() {
    setTourStep((prev) => Math.min(3, prev + 1));
  }

  function skipTour() {
    setTourStep(0);
  }

  function completeTour() {
    setTourStep(0);
    setMessage("Tour completed. You're all set.");
  }

  function toggleReminderPref(key) {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleImportExtract(event) {
    event.preventDefault();
    setImportError("");
    setExtractionError("");
    setImportLoading(true);
    setExtractionLoading(true);

    try {
      const input = importInput.trim();
      const detectedUrl = findFirstUrl(input);

      // If it's a URL, use the API extraction (Phase 8)
      if (detectedUrl) {
        try {
          const result = await extractFromUrl(detectedUrl);
          const { extracted } = result.data;
          
          // Store the extracted data to show in preview modal
          setExtractedData(extracted);
          setImportError("");
          setExtractionError("");
        } catch (apiError) {
          // Fall back to local parsing if API fails
          console.warn("API extraction failed, falling back to local parsing", apiError);
          setExtractionError(apiError.message || "Extraction service unavailable. Using fallback parsing.");
          
          await new Promise((resolve) => setTimeout(resolve, 700));
          const parsed = parseImportInput(input);
          setImportDraft(parsed);
        }
      } else {
        // For non-URLs, use local parsing as before
        await new Promise((resolve) => setTimeout(resolve, 700));
        const parsed = parseImportInput(input);
        setImportDraft(parsed);
      }
    } catch (extractError) {
      setImportError(extractError.message || "Unable to parse input.");
    } finally {
      setImportLoading(false);
      setExtractionLoading(false);
    }
  }

  function handleExtractionFieldChange(fieldKey, value) {
    setExtractedData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  }

  function handleExtractionCancel() {
    setExtractedData(null);
    setExtractionError("");
  }

  function handleEditApplicationOpen(appId) {
    const app = applications.find((a) => a.id === appId);
    if (app) {
      setImportDraft({
        companyName: app.companyName || "",
        positionTitle: app.positionTitle || "",
        location: app.location || "",
        applicationUrl: app.applicationUrl || "",
        status: app.status,
        appliedAt: app.appliedAt || "",
        remotePolicy: app.remotePolicy || "",
        salaryRange: app.salaryRange || "",
      });
      setEditingApplicationId(appId);
    }
  }

  function handleEditApplicationSave() {
    if (!editingApplicationId) return;
    
    const payload = normalizePayload(importDraft);
    if (!payload.companyName.trim()) {
      setImportFieldErrors({ companyName: "Company name is required" });
      return;
    }
    if (!payload.positionTitle.trim()) {
      setImportFieldErrors({ positionTitle: "Position title is required" });
      return;
    }
    
    setSaving(true);
    setImportFieldErrors({});
    
    updateApplication(editingApplicationId, payload)
      .then(() => {
        setMessage("Application updated.");
        setEditingApplicationId(null);
        setImportDraft(null);
        loadApplications();
      })
      .catch((err) => {
        setError(err.message || "Failed to update application.");
      })
      .finally(() => {
        setSaving(false);
      });
  }

  function openEventEditor(event = null) {
    if (event) {
      setEventEditingId(event.id);
      setEventForm({
        title: event.title || "Interview",
        startsAt: toDateTimeLocalValue(event.startsAt),
        endsAt: toDateTimeLocalValue(event.endsAt),
        notes: event.notes || "",
      });
    } else {
      setEventEditingId(null);
      setEventForm(EMPTY_EVENT_FORM);
    }

    setEventStatus("idle");
    setEventEditorOpen(true);
  }

  async function handleEventSave(event) {
    event.preventDefault();

    if (!selectedApplicationId) {
      return;
    }

    if (!eventForm.startsAt) {
      setEventStatus("error");
      setError("Interview start time is required.");
      return;
    }

    setEventStatus("saving");

    try {
      const payload = {
        eventType: "interview",
        title: eventForm.title.trim() || "Interview",
        startsAt: appDateTimeLocalToIso(eventForm.startsAt),
        endsAt: eventForm.endsAt ? appDateTimeLocalToIso(eventForm.endsAt) : null,
        notes: eventForm.notes.trim(),
      };

      let savedEvent;
      if (eventEditingId) {
        const data = await updateApplicationEvent(eventEditingId, payload);
        savedEvent = data.event;
      } else {
        const data = await createApplicationEvent(selectedApplicationId, payload);
        savedEvent = data.event;
      }

      setEventsByApp((prev) => {
        const existing = prev[selectedApplicationId] || [];
        const nextEvents = eventEditingId
          ? existing.map((item) => (item.id === eventEditingId ? savedEvent : item))
          : [...existing, savedEvent];

        nextEvents.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        return {
          ...prev,
          [selectedApplicationId]: nextEvents,
        };
      });

      setEventStatus("saved");
      setEventEditorOpen(false);
      setEventEditingId(null);
      setMessage(eventEditingId ? "Interview schedule updated." : "Interview scheduled.");
    } catch (saveError) {
      setEventStatus("error");
      setError(saveError.message || "Failed to save interview schedule.");
    }
  }

  async function handleEventDelete(eventId) {
    if (!selectedApplicationId) {
      return;
    }

    setEventStatus("saving");

    try {
      await deleteApplicationEvent(eventId);
      setEventsByApp((prev) => ({
        ...prev,
        [selectedApplicationId]: (prev[selectedApplicationId] || []).filter((item) => item.id !== eventId),
      }));
      setEventStatus("idle");
      setMessage("Interview event removed.");
    } catch (deleteError) {
      setEventStatus("error");
      setError(deleteError.message || "Failed to delete event.");
    }
  }

  function closeEditModal() {
    setEditingApplicationId(null);
    setImportDraft(null);
    setImportFieldErrors({});
  }

  function handleExtractionConfirm() {
    if (!extractedData) {
      return;
    }

    // Populate the import draft from extracted data
    const draft = {
      ...DEFAULT_IMPORT_DRAFT,
      companyName: extractedData.companyName || "",
      positionTitle: extractedData.positionTitle || "",
      location: extractedData.location || "",
      applicationUrl: extractedData.sourceUrl || "",
      appliedAt: getAppDateKey(),
    };

    setImportDraft(draft);
    setExtractedData(null);
    setExtractionError("");
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
    const nextFieldErrors = {
      companyName: payload.companyName ? "" : "Company name is required.",
      positionTitle: payload.positionTitle ? "" : "Position title is required.",
    };

    if (nextFieldErrors.companyName || nextFieldErrors.positionTitle) {
      setImportFieldErrors(nextFieldErrors);
      setImportError("Please fix the highlighted fields.");
      return;
    }

    setImportFieldErrors({});
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

  function closeImportDraftModal() {
    setImportDraft(null);
    setImportFieldErrors({});
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

    return daysBetween(application.statusChangedAt, new Date());
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
      appliedAt: getAppDateKey(),
    });

    importSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  function renderApplicationCard(application, view = "list") {
    const isKanban = view === "kanban";
    const stale = staleDays(application);
    const isStale = stale !== null && stale > 14;
    const selected = selectedApplicationId === application.id;
    const focused = focusedApplicationId === application.id;

    return (
      <article
        key={application.id}
        className={`application-row row-anim ${isKanban ? "application-row-kanban" : ""} ${selected ? "row-selected" : ""} ${isStale ? "row-stale" : ""} ${focused ? "row-focused" : ""}`}
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
              {!isKanban ? <span className="mono-text">Applied {formatDate(application.appliedAt)}</span> : null}
              <span className="mono-text">Updated {formatDate(application.updatedAt)}</span>
              {isStale ? <span className="attention-dot">Needs attention</span> : null}
            </div>
            {!isKanban ? <div className="shortcut-hint">Enter: open, S: status, N: notes</div> : null}
          </div>
        </div>

        <div className="row-right" data-floating-menu>
          <div className="row-hover-actions">
            <button type="button" className="icon-btn" onClick={(event) => { event.stopPropagation(); handleEditApplicationOpen(application.id); }} aria-label="Edit application">
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
    const scheduledEvents = eventsByApp[selectedApplicationId] || [];

    if (!selectedApplication) {
      return <div className="empty-state">Select an application to open split-pane details.</div>;
    }

    return (
      <>
        <div className="panel-header">
          <h2 id="detail-drawer-title">{selectedApplication.companyName}</h2>
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

        {(selectedApplication.status === "interview" || scheduledEvents.length > 0) && (
          <section className="stack-sm">
            <div className="panel-header">
              <h3>Interview Schedule</h3>
              <button type="button" className="btn btn-subtle" onClick={() => openEventEditor()}>
                Schedule Interview
              </button>
            </div>
            {scheduledEvents.length ? (
              <div className="stack-sm">
                {scheduledEvents.map((scheduledEvent) => (
                  <article key={scheduledEvent.id} className="scheduled-event-card">
                    <div>
                      <p className="company-title">{scheduledEvent.title}</p>
                      <p className="muted-text">{formatDateTime(scheduledEvent.startsAt)}</p>
                      {scheduledEvent.notes ? <p className="muted-text">{scheduledEvent.notes}</p> : null}
                    </div>
                    <div className="row-actions">
                      <button type="button" className="btn btn-subtle" onClick={() => openEventEditor(scheduledEvent)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-subtle btn-danger" onClick={() => handleEventDelete(scheduledEvent.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No interview scheduled yet.</p>
              </div>
            )}
          </section>
        )}

        {selectedApplication.status === "offer" && (
          <section className="stack-sm">
            <h3>Offer Compensation</h3>
            <CompensationForm
              applicationId={selectedApplicationId}
              userId={user?.id}
              onSave={(compensation) => {
                setCompensationByApp((prev) => ({
                  ...prev,
                  [selectedApplicationId]: compensation,
                }));
              }}
              onError={(error) => setError(error)}
            />
          </section>
        )}

        <section className="stack-sm">
          <h3>Contacts</h3>
          <p className="muted-text">Recruiter, hiring manager, and referral tracking placeholder for upcoming CRM-lite flow.</p>
        </section>
      </>
    );
  }

  const showSearchEmpty = !loading && visibleApplications.length === 0 && searchText.trim().length > 0;
  const showFirstRunEmpty = !loading && total === 0 && !searchText.trim() && !focusMode;
  const showGuidedEmpty = !loading && visibleApplications.length === 0 && !searchText.trim() && Boolean(focusMode);
  const isBoardView = viewMode === "kanban";

  function openApplicationsView() {
    setViewMode("list");
  }

  function openBoardView() {
    setViewMode("kanban");
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AppSidebar
        current={settingsOpen ? "settings" : isBoardView ? "board" : "applications"}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        includeSettings
        onOpenHome={() => onOpenHome?.()}
        onOpenApplications={openApplicationsView}
        onOpenBoard={openBoardView}
        onOpenOffers={() => onOpenOffers?.()}
        onOpenSettings={() => setSettingsOpen((prev) => !prev)}
      />

      <main className="app-content">
        <header className="app-header">
          <div>
            <h1 className="app-title company-display">Opportunity Command Center</h1>
            <p className="app-subtitle">Fast import, instant status updates, and a split-pane workflow.</p>
          </div>
          <div className="app-user-actions">
            <span className="muted-text">{user?.email}</span>
            <button type="button" className="btn btn-subtle" onClick={onToggleTheme}>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
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

        {tourStep > 0 && (
          <section className="panel tour-panel" role="dialog" aria-label="Quick app tour">
            <h2>Quick Tour ({tourStep}/3)</h2>
            {tourStep === 1 ? <p>Start by pasting a URL into Quick Import to add applications fast.</p> : null}
            {tourStep === 2 ? <p>Click any status badge to update status instantly from the list.</p> : null}
            {tourStep === 3 ? <p>The Pipeline Health bar is clickable and filters your list by stage.</p> : null}
            <div className="row-actions">
              <button type="button" className="btn btn-subtle" onClick={skipTour}>Skip</button>
              {tourStep < 3 ? (
                <button type="button" className="btn btn-primary" onClick={nextTourStep}>Next</button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={completeTour}>Finish</button>
              )}
            </div>
          </section>
        )}

        {showNotificationPrompt && (
          <section className="panel reminder-panel" role="dialog" aria-label="Notification permission prompt">
            <h2>Enable reminders?</h2>
            <p>You have added at least 3 applications. Enable push reminders now or manage this in Settings later.</p>
            <div className="row-actions">
              <button type="button" className="btn btn-subtle" onClick={dismissNotificationPrompt}>Not now</button>
              <button type="button" className="btn btn-primary" onClick={handleNotificationPermission}>Enable push reminders</button>
            </div>
          </section>
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
              const count = pipelineCounts[status];
              const denominator = visibleApplications.length || 1;
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
                  aria-label={`${STATUS_LABELS[status]} segment, ${count} applications`}
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

          {/* Phase 8: URL Extraction Preview Modal */}
          <ExtractionPreview
            extracted={extractedData}
            loading={extractionLoading}
            onCancel={handleExtractionCancel}
            onConfirm={handleExtractionConfirm}
            onFieldChange={handleExtractionFieldChange}
          />

          {/* Import Review Modal */}
          {importDraft && !editingApplicationId && (
            <div className="import-modal-scrim" role="presentation">
              <div
                className="import-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Review extracted application"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="panel-header">
                  <h3>Review Extracted Application</h3>
                  <button type="button" className="btn btn-subtle" onClick={closeImportDraftModal}>
                    Close
                  </button>
                </div>

                <div className="grid-two">
                  <label>
                    Company
                    <input
                      className={`input ${importFieldErrors.companyName ? "input-error" : ""}`}
                      value={importDraft.companyName}
                      onChange={(event) => {
                        setImportDraft({ ...importDraft, companyName: event.target.value });
                        setImportFieldErrors((prev) => ({ ...prev, companyName: "" }));
                      }}
                      aria-invalid={Boolean(importFieldErrors.companyName)}
                    />
                    {importFieldErrors.companyName ? <span className="field-error">{importFieldErrors.companyName}</span> : null}
                  </label>
                  <label>
                    Role
                    <input
                      className={`input ${importFieldErrors.positionTitle ? "input-error" : ""}`}
                      value={importDraft.positionTitle}
                      onChange={(event) => {
                        setImportDraft({ ...importDraft, positionTitle: event.target.value });
                        setImportFieldErrors((prev) => ({ ...prev, positionTitle: "" }));
                      }}
                      aria-invalid={Boolean(importFieldErrors.positionTitle)}
                    />
                    {importFieldErrors.positionTitle ? <span className="field-error">{importFieldErrors.positionTitle}</span> : null}
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
                  <button type="button" className="btn btn-subtle" onClick={closeImportDraftModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleImportSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Application"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Application Modal */}
          {importDraft && editingApplicationId && (
            <div className="import-modal-scrim" role="presentation">
              <div
                className="import-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Edit application"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="panel-header">
                  <h3>Edit Application</h3>
                  <button type="button" className="btn btn-subtle" onClick={closeEditModal}>
                    Close
                  </button>
                </div>

                <div className="grid-two">
                  <label>
                    Company
                    <input
                      className={`input ${importFieldErrors.companyName ? "input-error" : ""}`}
                      value={importDraft.companyName}
                      onChange={(event) => {
                        setImportDraft({ ...importDraft, companyName: event.target.value });
                        setImportFieldErrors((prev) => ({ ...prev, companyName: "" }));
                      }}
                      aria-invalid={Boolean(importFieldErrors.companyName)}
                    />
                    {importFieldErrors.companyName ? <span className="field-error">{importFieldErrors.companyName}</span> : null}
                  </label>
                  <label>
                    Role
                    <input
                      className={`input ${importFieldErrors.positionTitle ? "input-error" : ""}`}
                      value={importDraft.positionTitle}
                      onChange={(event) => {
                        setImportDraft({ ...importDraft, positionTitle: event.target.value });
                        setImportFieldErrors((prev) => ({ ...prev, positionTitle: "" }));
                      }}
                      aria-invalid={Boolean(importFieldErrors.positionTitle)}
                    />
                    {importFieldErrors.positionTitle ? <span className="field-error">{importFieldErrors.positionTitle}</span> : null}
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
                  <button type="button" className="btn btn-subtle" onClick={closeEditModal}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleEditApplicationSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {settingsOpen && (
          <section className="panel settings-panel" aria-label="Notification and export settings">
            <div className="panel-header">
              <h2>Settings</h2>
              <button type="button" className="btn btn-subtle" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>

            <div className="settings-grid">
              <div className="toggle-row">
                <span>Google Account</span>
                <span className={`status-pill ${googleStatus.connected ? "status-offer" : "status-applied"}`}>
                  {googleStatus.loading ? "Checking..." : googleStatus.connected ? "Connected" : "Not Connected"}
                </span>
              </div>
              {googleStatus.connected && googleStatus.email ? (
                <p className="muted-text">Connected as {googleStatus.email}</p>
              ) : null}
              <label className="toggle-row">
                <input type="checkbox" checked={notificationPrefs.pushEnabled} onChange={() => toggleReminderPref("pushEnabled")} />
                <span>Enable push reminders</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={notificationPrefs.emailEnabled} onChange={() => toggleReminderPref("emailEnabled")} />
                <span>Enable reminder emails</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={notificationPrefs.noNewApps} onChange={() => toggleReminderPref("noNewApps")} />
                <span>No new applications in 7 days</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={notificationPrefs.staleInterview} onChange={() => toggleReminderPref("staleInterview")} />
                <span>Interview stale for 5 days</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={notificationPrefs.staleOffer} onChange={() => toggleReminderPref("staleOffer")} />
                <span>Offer stale for 10 days</span>
              </label>
            </div>

            <div className="row-actions">
              <button type="button" className="btn btn-primary" onClick={handleCsvExport}>Export CSV</button>
              <button type="button" className="btn btn-subtle" onClick={handleConnectGoogleAccount} disabled={googleLinking}>
                {googleLinking ? "Connecting..." : "Connect Google Account"}
              </button>
            </div>
            <p className="muted-text">Reminder emails always include one-click unsubscribe link.</p>
          </section>
        )}

        {reminderCards.length > 0 && (
          <section className="panel reminder-list-panel" aria-label="Reminder preview list">
            <h2>Reminder Preview</h2>
            <div className="stack-sm">
              {reminderCards.map((card) => (
                <article key={card.id} className="reminder-card">
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

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
                  onChange={(event) => {
                    clearFocusMode();
                    setSearchText(event.target.value);
                  }}
                  placeholder="Search company, role, location, notes"
                />
                {searchHintVisible && <span className="search-hint">⌘K or / to search</span>}
              </div>
              <select className="input" value={statusFilter} onChange={(event) => {
                clearFocusMode();
                setStatusFilter(event.target.value);
              }}>
                <option value="all">All statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
              <select className="input" value={sortBy} onChange={(event) => {
                clearFocusMode();
                setSortBy(event.target.value);
              }}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select className="input" value={sortOrder} onChange={(event) => {
                clearFocusMode();
                setSortOrder(event.target.value);
              }}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {focusModeMeta ? (
              <div className="panel focus-banner" role="status" aria-label={focusModeMeta.title}>
                <div>
                  <p className="metric-label">{focusModeMeta.title}</p>
                  <p className="muted-text">{focusModeMeta.body}</p>
                </div>
                <button type="button" className="btn btn-subtle" onClick={clearFocusMode}>
                  Clear Guided View
                </button>
              </div>
            ) : null}

            {loading ? (
              <div className="skeleton-list" aria-label="Loading applications">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="skeleton-row">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-content">
                      <div className="skeleton-line skeleton-line-lg" />
                      <div className="skeleton-line" />
                      <div className="skeleton-line skeleton-line-sm" />
                    </div>
                    <div className="skeleton-pill" />
                  </div>
                ))}
              </div>
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
            ) : showGuidedEmpty ? (
              <div className="empty-state">
                <p>No applications match this guided view right now.</p>
                <button type="button" className="btn btn-primary" onClick={clearFocusMode}>
                  Return to All Applications
                </button>
              </div>
            ) : viewMode === "list" ? (
              <div className="application-list list-transition">
                {visibleApplications.map((application) => renderApplicationCard(application, "list"))}
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
                        groupedForKanban[status].map((application) => renderApplicationCard(application, "kanban"))
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="pagination-row">
              <span className="muted-text">
                {focusMode ? `Showing ${displayTotal} guided matches` : `Showing ${pageSize} per page (${displayTotal} total)`}
              </span>
              <div className="row-actions">
                <select className="input input-small" value={pageSize} onChange={(event) => {
                  clearFocusMode();
                  setPageSize(Number(event.target.value));
                }} disabled={Boolean(focusMode)}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button type="button" className="btn btn-subtle" disabled={focusMode || page <= 1} onClick={() => setPage((prev) => prev - 1)}>Prev</button>
                <span className="muted-text mono-text">Page {focusMode ? 1 : page} / {displayTotalPages}</span>
                <button type="button" className="btn btn-subtle" disabled={focusMode || page >= displayTotalPages} onClick={() => setPage((prev) => prev + 1)}>Next</button>
              </div>
            </div>
          </section>

          {!isMobile && (
            <aside className="panel detail-drawer" role="dialog" aria-labelledby="detail-drawer-title">
              {renderDetailContent()}
            </aside>
          )}
        </div>
      </main>

      {isMobile && selectedApplication && (
        <div className="mobile-sheet-scrim" onClick={closeDetails}>
          <div
            className="mobile-sheet"
            role="dialog"
            aria-labelledby="detail-drawer-title"
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
        <AppMobileNav
          current={settingsOpen ? "settings" : isBoardView ? "board" : "applications"}
          includeSettings
          onOpenHome={() => onOpenHome?.()}
          onOpenApplications={openApplicationsView}
          onOpenBoard={openBoardView}
          onOpenOffers={() => onOpenOffers?.()}
          onOpenSettings={() => setSettingsOpen((prev) => !prev)}
        />
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

      {eventEditorOpen && selectedApplication && (
        <div className="compensation-modal-scrim" role="presentation" onClick={() => eventStatus !== "saving" && setEventEditorOpen(false)}>
          <div
            className="compensation-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Interview schedule form"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-header">
              <h3>{eventEditingId ? "Edit Interview Schedule" : "Schedule Interview"}</h3>
              <button type="button" className="btn btn-subtle" onClick={() => setEventEditorOpen(false)} disabled={eventStatus === "saving"}>
                Close
              </button>
            </div>

            <form onSubmit={handleEventSave} className="compensation-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="event-title">Title</label>
                  <input
                    id="event-title"
                    className="input"
                    value={eventForm.title}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
                    disabled={eventStatus === "saving"}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-starts-at">Start Time</label>
                  <input
                    id="event-starts-at"
                    type="datetime-local"
                    className="input"
                    value={eventForm.startsAt}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, startsAt: event.target.value }))}
                    disabled={eventStatus === "saving"}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-ends-at">End Time</label>
                  <input
                    id="event-ends-at"
                    type="datetime-local"
                    className="input"
                    value={eventForm.endsAt}
                    onChange={(event) => setEventForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                    disabled={eventStatus === "saving"}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="event-notes">Notes</label>
                <textarea
                  id="event-notes"
                  className="input"
                  rows={4}
                  value={eventForm.notes}
                  onChange={(event) => setEventForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Add interview location, prep links, recruiter details, or meeting notes"
                  disabled={eventStatus === "saving"}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={eventStatus === "saving"}>
                  {eventStatus === "saving" ? "Saving..." : "Save Interview"}
                </button>
                <button type="button" className="btn btn-subtle" onClick={() => setEventEditorOpen(false)} disabled={eventStatus === "saving"}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
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
