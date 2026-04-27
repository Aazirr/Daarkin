import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { AppMobileNav, AppSidebar } from "./components/AppNavigation.jsx";
import { fetchApplications, setAuthToken as setApplicationsAuthToken } from "./services/applications-api.js";
import { fetchUpcomingEvents, setAuthToken as setEventsAuthToken } from "./services/events-api.js";
import {
  addDaysToAppDateKey,
  formatDateTimeInAppTimeZone,
  getAppDateKey,
  getAppDayDifference,
  getAppHour,
  getWeekdayLabelInAppTimeZone,
} from "./utils/app-timezone.js";

const STAT_DEFINITIONS = [
  {
    id: "today",
    label: "Applications Today",
    helper: "Captured in Daarkin today",
  },
  {
    id: "active",
    label: "Active Pipeline",
    helper: "Applied, interview, and offer",
  },
  {
    id: "interviews",
    label: "Interviews",
    helper: "Currently in interview stage",
  },
  {
    id: "offers",
    label: "Offers",
    helper: "Open offer-stage opportunities",
  },
  {
    id: "followUps",
    label: "Needs Follow-Up",
    helper: "Aging items worth revisiting",
  },
];

function daysSince(value, now = new Date()) {
  return getAppDayDifference(value, now);
}

function getDisplayName(user) {
  if (!user?.email) {
    return "there";
  }

  const emailPrefix = user.email.split("@")[0] || "";
  const normalized = emailPrefix
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return normalized || "there";
}

function getGreeting() {
  const hour = getAppHour();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

function buildActivitySeries(applications) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = addDaysToAppDateKey(getAppDateKey(), index - 6);
    return {
      key,
      label: getWeekdayLabelInAppTimeZone(key),
      count: 0,
    };
  });

  const dayMap = new Map(days.map((day) => [day.key, day]));

  applications.forEach((application) => {
    const createdKey = getAppDateKey(application.createdAt);
    if (!createdKey || !dayMap.has(createdKey)) {
      return;
    }
    dayMap.get(createdKey).count += 1;
  });

  return days;
}

function getRelativeEventLabel(startsAt) {
  const diffDays = getAppDayDifference(new Date(), startsAt);

  if (diffDays === 0) {
    return "today";
  }
  if (diffDays === 1) {
    return "tomorrow";
  }
  return null;
}

function buildHomeSummary(applications, totalCount, upcomingEvents) {
  const now = new Date();
  const todayKey = getAppDateKey(now);
  const activeApplications = applications.filter((application) => application.status !== "rejected");
  const interviews = applications.filter((application) => application.status === "interview");
  const offers = applications.filter((application) => application.status === "offer");
  const todayApplications = applications.filter((application) => getAppDateKey(application.createdAt) === todayKey);

  const aging = {
    oneWeek: 0,
    twoWeeks: 0,
    threeWeeks: 0,
  };

  const reminders = [];
  let staleInterviewCount = 0;

  activeApplications.forEach((application) => {
    const ageInDays = daysSince(application.createdAt || application.appliedAt, now);
    const idleDays = daysSince(application.updatedAt || application.statusChangedAt || application.createdAt, now);

    if (ageInDays >= 7 && ageInDays < 14) {
      aging.oneWeek += 1;
    } else if (ageInDays >= 14 && ageInDays < 21) {
      aging.twoWeeks += 1;
    } else if (ageInDays >= 21) {
      aging.threeWeeks += 1;
    }

    if (application.status === "interview" && idleDays >= 5) {
      staleInterviewCount += 1;
      reminders.push({
        id: `interview-${application.id}`,
        title: `Follow up with ${application.companyName}`,
        body: "Interview-stage application has gone quiet for 5+ days.",
        action: "Review follow-up",
        intent: { focusMode: "follow-ups", statusFilter: "interview", pageSize: 100, sortOrder: "asc" },
      });
    }
  });

  upcomingEvents.forEach((event) => {
    if (event.eventType !== "interview") {
      return;
    }

    const relativeLabel = getRelativeEventLabel(event.startsAt);
    if (!relativeLabel) {
      return;
    }

    reminders.unshift({
      id: `upcoming-${event.id}`,
      title: `Interview ${relativeLabel} with ${event.companyName}`,
      body: `${event.title} is scheduled for ${formatDateTimeInAppTimeZone(event.startsAt)}.`,
      action: "Open application",
      intent: { statusFilter: "interview", pageSize: 100, sortOrder: "asc" },
    });
  });

  if (aging.twoWeeks + aging.threeWeeks > 0) {
    reminders.push({
      id: "aging-bucket",
      title: `${aging.twoWeeks + aging.threeWeeks} aging applications need attention`,
      body: "Two-week and three-week applications are prime follow-up candidates.",
      action: "Open aging list",
      intent: { focusMode: "aging-14-plus", pageSize: 100, sortOrder: "asc" },
    });
  }

  const newestCreatedAt = applications
    .map((application) => new Date(application.createdAt).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  if (!newestCreatedAt || Date.now() - newestCreatedAt > 4 * 24 * 60 * 60 * 1000) {
    reminders.push({
      id: "quiet-search",
      title: "Search momentum is slowing down",
      body: "No new applications have been captured in the last 4 days.",
      action: "Save an application",
      intent: { focusImport: true, pageSize: 100 },
    });
  }

  const followUps = activeApplications.filter((application) => {
    const idleDays = daysSince(application.updatedAt || application.statusChangedAt || application.createdAt, now);
    return application.status !== "offer" && idleDays >= 7;
  }).length;

  const stats = {
    today: todayApplications.length,
    active: totalCount ? activeApplications.length : 0,
    interviews: interviews.length,
    offers: offers.length,
    followUps,
  };

  return {
    stats,
    aging,
    reminders: reminders
      .sort((a, b) => {
        if (a.id.startsWith("interview-") && !b.id.startsWith("interview-")) {
          return -1;
        }
        if (!a.id.startsWith("interview-") && b.id.startsWith("interview-")) {
          return 1;
        }
        return 0;
      })
      .slice(0, 3),
    activity: buildActivitySeries(applications),
    staleInterviewCount,
  };
}

export default function Home({
  theme = "dark",
  onToggleTheme,
  onOpenApplications,
  onOpenBoard,
  onOpenOffers,
  onQuickImport,
  onReviewFollowUps,
}) {
  const { user, token, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "1");
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickImportInput, setQuickImportInput] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    setApplicationsAuthToken(token || null);
    setEventsAuthToken(token || null);
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      setLoading(true);
      setError("");

      try {
        const [result, upcomingResult] = await Promise.all([
          fetchApplications({
            sortBy: "updatedAt",
            sortOrder: "desc",
            page: 1,
            pageSize: 100,
          }),
          fetchUpcomingEvents(2),
        ]);

        if (cancelled) {
          return;
        }

        setApplications(result.data?.applications || []);
        setTotalCount(result.meta?.pagination?.total || 0);
        setUpcomingEvents(upcomingResult.events || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load your home summary.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (token) {
      loadHomeData();
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  const summary = useMemo(
    () => buildHomeSummary(applications, totalCount, upcomingEvents),
    [applications, totalCount, upcomingEvents]
  );
  const displayName = getDisplayName(user);
  const greeting = getGreeting();
  const highestActivity = Math.max(1, ...summary.activity.map((day) => day.count));

  const summaryLine = summary.reminders[0]
    ? `${summary.reminders.length} guided checks are ready for review today.`
    : "Your search snapshot is calm right now. Keep the momentum going.";

  function handleQuickImportSubmit(event) {
    event.preventDefault();
    const trimmed = quickImportInput.trim();
    if (!trimmed) {
      return;
    }
    onQuickImport?.(trimmed);
  }

  function handleReminderAction(intent) {
    if (intent?.focusImport) {
      onQuickImport?.(quickImportInput.trim() || "");
      return;
    }

    if (intent) {
      onOpenApplications?.(intent);
    }
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <AppSidebar
        current="home"
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onOpenApplications={() => onOpenApplications?.()}
        onOpenBoard={() => onOpenBoard?.()}
        onOpenOffers={() => onOpenOffers?.()}
      />

      <main className="app-content home-content">
        <header className="app-header home-header">
          <div>
            <p className="eyebrow-text">{greeting}</p>
            <h1 className="app-title company-display">Welcome back, {displayName}</h1>
            <p className="app-subtitle">Here is your search snapshot for today.</p>
            <p className="muted-text">{summaryLine}</p>
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

        {error ? <div className="alert alert-error">{error}</div> : null}

        <section className="home-command-panel" aria-label="Quick capture and next step">
          <div className="home-command-copy">
            <p className="metric-label">Next Move</p>
            <h2>{summary.reminders[0]?.title || "Keep the pipeline moving"}</h2>
            <p className="muted-text">
              {summary.reminders[0]?.body || "Save a fresh lead, review the board, or compare active offers from one place."}
            </p>
          </div>

          <form onSubmit={handleQuickImportSubmit} className="home-command-form">
            <input
              className="input"
              value={quickImportInput}
              onChange={(event) => setQuickImportInput(event.target.value)}
              placeholder="Paste a job URL or company name"
            />
            <button type="submit" className="btn btn-primary">
              Start Import
            </button>
            <button type="button" className="btn btn-subtle" onClick={() => onOpenApplications?.()}>
              Open Applications
            </button>
          </form>
        </section>

        <section className="home-stats-grid" aria-label="Home overview statistics">
          {STAT_DEFINITIONS.map((definition) => (
            <button
              key={definition.id}
              type="button"
              className="panel stat-card"
              onClick={() => {
                if (definition.id === "offers") {
                  onOpenOffers?.();
                } else if (definition.id === "followUps") {
                  onOpenApplications?.({
                    focusMode: "follow-ups",
                    pageSize: 100,
                    sortOrder: "asc",
                  });
                } else if (definition.id === "interviews") {
                  onOpenApplications?.({
                    statusFilter: "interview",
                    pageSize: 100,
                    sortOrder: "asc",
                  });
                } else if (definition.id === "today") {
                  onOpenApplications?.({
                    focusMode: "created-today",
                    sortBy: "createdAt",
                    sortOrder: "desc",
                    pageSize: 100,
                  });
                } else if (definition.id === "active") {
                  onOpenApplications?.({
                    focusMode: "active-pipeline",
                    pageSize: 100,
                  });
                } else {
                  onOpenApplications?.();
                }
              }}
            >
              <p className="metric-label">{definition.label}</p>
              <p className="home-stat-value mono-text">
                {loading ? "..." : summary.stats[definition.id]}
              </p>
              <p className="muted-text">{definition.helper}</p>
            </button>
          ))}
        </section>

        <section className="home-workbench-grid">
          <section className="panel home-activity-panel">
            <div className="panel-header">
              <div>
                <h2>Search Activity</h2>
                <p className="muted-text">Applications captured over the last 7 days.</p>
              </div>
            </div>

            <div className="activity-chart" aria-label="Search activity chart">
              {summary.activity.map((day) => (
                <div key={day.key} className="activity-bar-group">
                  <div className="activity-bar-rail">
                    <div
                      className="activity-bar-fill"
                      style={{ height: `${Math.max(8, (day.count / highestActivity) * 100)}%` }}
                      title={`${day.label}: ${day.count}`}
                    />
                  </div>
                  <span className="activity-bar-label">{day.label}</span>
                  <span className="activity-bar-count mono-text">{day.count}</span>
                </div>
              ))}
            </div>

            <div className="home-aging-strip" aria-label="Aging applications">
              <div>
                <p className="metric-label">Aging Applications</p>
                <p className="muted-text">Follow-up opportunities by application age.</p>
              </div>
              <div className="home-aging-grid">
                <button
                  type="button"
                  className="home-aging-card"
                  onClick={() => onOpenApplications?.({ focusMode: "aging-7-13", pageSize: 100, sortOrder: "asc" })}
                >
                  <span className="home-aging-label">1 Week</span>
                  <strong className="mono-text">{summary.aging.oneWeek}</strong>
                </button>
                <button
                  type="button"
                  className="home-aging-card"
                  onClick={() => onOpenApplications?.({ focusMode: "aging-14-20", pageSize: 100, sortOrder: "asc" })}
                >
                  <span className="home-aging-label">2 Weeks</span>
                  <strong className="mono-text">{summary.aging.twoWeeks}</strong>
                </button>
                <button
                  type="button"
                  className="home-aging-card"
                  onClick={() => onOpenApplications?.({ focusMode: "aging-21-plus", pageSize: 100, sortOrder: "asc" })}
                >
                  <span className="home-aging-label">3+ Weeks</span>
                  <strong className="mono-text">{summary.aging.threeWeeks}</strong>
                </button>
              </div>
            </div>
          </section>

          <section className="panel home-reminders-panel">
            <div className="panel-header">
              <div>
                <h2>Upcoming and Reminders</h2>
                <p className="muted-text">The clearest items to act on next.</p>
              </div>
            </div>

            <div className="home-reminder-list">
              {summary.reminders.length ? (
                summary.reminders.map((reminder) => (
                  <article key={reminder.id} className="home-reminder-card">
                    <div>
                      <h3>{reminder.title}</h3>
                      <p>{reminder.body}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-subtle"
                      onClick={() => handleReminderAction(reminder.intent)}
                    >
                      {reminder.action}
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-state home-empty-state">
                  <p>No urgent reminders right now.</p>
                </div>
              )}
            </div>
          </section>

          <section className="panel home-actions-panel">
            <div className="panel-header">
              <div>
                <h2>Recommended Actions</h2>
                <p className="muted-text">Jump into the next best workflow.</p>
              </div>
            </div>

            <div className="home-actions-grid">
              <button type="button" className="home-action-card" onClick={() => onOpenApplications?.()}>
                <strong>View Applications</strong>
                <span>Open your full pipeline workspace.</span>
              </button>
              <button type="button" className="home-action-card" onClick={() => onQuickImport?.("")}>
                <strong>Save an Application</strong>
                <span>Jump straight into the capture flow.</span>
              </button>
              <button
                type="button"
                className="home-action-card"
                onClick={() =>
                  onOpenApplications?.({
                    focusMode: "follow-ups",
                    pageSize: 100,
                    sortOrder: "asc",
                  })
                }
              >
                <strong>Review Follow-Ups</strong>
                <span>See aging items and stalled conversations.</span>
              </button>
              <button type="button" className="home-action-card" onClick={() => onOpenOffers?.()}>
                <strong>Check Offers</strong>
                <span>Compare active offer-stage opportunities.</span>
              </button>
            </div>
          </section>
        </section>
      </main>

      <AppMobileNav
        current="home"
        onOpenHome={() => undefined}
        onOpenApplications={() => onOpenApplications?.()}
        onOpenBoard={() => onOpenBoard?.()}
        onOpenOffers={() => onOpenOffers?.()}
      />
    </div>
  );
}
