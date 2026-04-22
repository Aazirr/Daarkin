const PRIMARY_ITEMS = [
  { id: "home", label: "Home", shortLabel: "HM" },
  { id: "applications", label: "Applications", shortLabel: "AP" },
  { id: "board", label: "Board", shortLabel: "KB" },
  { id: "offers", label: "Offers", shortLabel: "OF" },
];

function buildItems({ includeSettings, onOpenHome, onOpenApplications, onOpenBoard, onOpenOffers, onOpenSettings }) {
  const items = [
    { ...PRIMARY_ITEMS[0], onClick: onOpenHome },
    { ...PRIMARY_ITEMS[1], onClick: onOpenApplications },
    { ...PRIMARY_ITEMS[2], onClick: onOpenBoard },
    { ...PRIMARY_ITEMS[3], onClick: onOpenOffers },
  ];

  if (includeSettings) {
    items.push({
      id: "settings",
      label: "Settings",
      shortLabel: "ST",
      onClick: onOpenSettings,
    });
  }

  return items;
}

export function AppSidebar({
  current,
  collapsed = false,
  onToggleCollapse,
  includeSettings = false,
  onOpenHome,
  onOpenApplications,
  onOpenBoard,
  onOpenOffers,
  onOpenSettings,
}) {
  const items = buildItems({
    includeSettings,
    onOpenHome,
    onOpenApplications,
    onOpenBoard,
    onOpenOffers,
    onOpenSettings,
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand-row">
        <div className="sidebar-brand" aria-label="Daarkin">
          <div className="sidebar-brand-mark">DK</div>
          {!collapsed ? (
            <div className="sidebar-brand-copy">
              <strong>Daarkin</strong>
              <span>Career command center</span>
            </div>
          ) : null}
        </div>

        {onToggleCollapse ? (
          <button
            type="button"
            className="sidebar-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "+" : "-"}
          </button>
        ) : null}
      </div>

      <div className="sidebar-section-label">{collapsed ? "NAV" : "Workspace"}</div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {items.map((item) => {
          const isActive = current === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => item.onClick?.()}
            >
              <span className="nav-item-kicker" aria-hidden="true">
                {item.shortLabel}
              </span>
              {!collapsed ? <span className="nav-item-label">{item.label}</span> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppMobileNav({
  current,
  includeSettings = false,
  onOpenHome,
  onOpenApplications,
  onOpenBoard,
  onOpenOffers,
  onOpenSettings,
}) {
  const items = buildItems({
    includeSettings,
    onOpenHome,
    onOpenApplications,
    onOpenBoard,
    onOpenOffers,
    onOpenSettings,
  });

  return (
    <div className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {items.map((item) => {
        const isActive = current === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`nav-item mobile-nav-item ${isActive ? "active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => item.onClick?.()}
          >
            <span className="nav-item-kicker" aria-hidden="true">
              {item.shortLabel}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
