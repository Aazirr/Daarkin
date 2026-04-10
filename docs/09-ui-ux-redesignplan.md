# Phase 5 UI/UX Reimagination - Implementation Todo List

## Goal
Make the app feel interactive, human, and fast while keeping it productive and scannable.

## How To Use This Checklist
- [ ] = not started
- [~] = in progress
- [x] = done

---

## P0 - Highest Impact First (Do these first)

### 1) Always-visible URL import bar
- [x] Add URL import bar at the top of the applications area (not behind a modal).
- [x] Accept URL, pasted job text, or company-name fallback.
- [x] Show inline loading state in the input area while extracting.
- [x] Expand inline confirmation form after extraction (company, role, location, remote policy, salary).
- [x] Allow inline edits before save.
- [x] Animate success by inserting new row at top of list.
- [x] Build minimal manual-entry fallback form (required: company, role, status only).

Acceptance:
- Adding from paste is possible in one visible flow from dashboard.
- User can complete add flow without opening any modal.

### 2) Optimistic UI updates
- [x] Optimistically update status changes in list and pipeline immediately.
- [x] Roll back optimistic changes on API failure.
- [x] Show short error toast/inline message on rollback.
- [x] Apply optimistic create/delete behavior for applications where safe.

Acceptance:
- Status change feels instant (<100ms visual feedback).
- Failed writes recover cleanly without stale UI.

### 3) Fast status management
- [~] Add row context menu (right-click desktop, long-press mobile).
- [x] Include status options plus Delete separated by divider.
- [x] Add clickable status badge popover as alternative quick action.
- [x] Add success micro-animation on status badge after change.
- [ ] Add contextual prompts after status transition:
- [ ] Interview -> prompt reminder action.
- [ ] Offer -> prompt add offer details.
- [ ] Rejected/No-response -> show brief empathetic confirmation.

Acceptance:
- Status update can be completed in a single quick interaction from list.

### 4) Detail drawer instead of page jumps
- [x] Build split-pane layout on desktop.
- [x] Keep list visible while detail drawer opens at right (~40% width).
- [x] Update URL on selection for deep-linking.
- [x] Support keyboard navigation between rows while drawer stays open.
- [x] Build top section in drawer (logo/initial, company, role, status control).
- [x] Build metadata pill row (location, remote policy, salary, source).
- [x] Build timeline section (status changes, notes events, opened events).
- [x] Add notes textarea with 500ms debounced autosave and "Saved" feedback.
- [x] Show offer details section only when status is Offer.
- [x] Add Contacts block (name, role, email/linkedin, interaction log placeholder).

Acceptance:
- Opening an application does not navigate away from list context.

### 5) Pipeline health bar
- [x] Replace basic summary cards with segmented pipeline distribution bar.
- [x] Add metrics under bar:
- [x] Response rate.
- [x] Average days to first response.
- [x] Active applications count.
- [x] Add week-over-week trend indicator beside total apps.
- [x] Make segments clickable to filter list; second click clears filter.
- [~] Animate filter transitions in list (preserve context, no abrupt jumps).

Acceptance:
- User understands pipeline state in about 2 seconds on load.

---

## P1 - Core UX Quality (Build after P0)

### 6) Visual design system (tokens first)
- [x] Create design token file using CSS custom properties.
- [x] Define semantic surface tokens (background/surface/raised/overlay).
- [x] Define text tokens (primary/secondary/tertiary/disabled).
- [x] Define border tokens (default/hover/focus/error).
- [x] Define status color tokens:
- [x] Applied = calm blue.
- [x] Interview = warm purple.
- [x] Offer = confident green.
- [x] Rejected/No-response = neutral gray.
- [x] Define spacing scale (8px base, plus 4px and 6px compact exceptions).
- [x] Define radius, shadow, and motion-duration tokens.
- [ ] Add dark/light token sets (no filter inversion approach).

Acceptance:
- Components consume tokens, not ad-hoc hardcoded values.

### 7) Typography system
- [x] Pick display/serif font for headings and company names.
- [x] Pick geometric sans for UI/body text.
- [x] Pick monospace for numeric values and dates.
- [~] Define text style scale (sizes, weights, line-heights) and apply consistently.

Acceptance:
- Company names/headings, body text, and numbers are visually distinct and consistent.

### 8) Layout and information architecture
- [x] Add persistent desktop sidebar with collapsible icon-only mode.
- [x] Set icon-only width to about 52px with hover tooltips.
- [x] Constrain main content max-width (~1100px) and center content.
- [x] Add list/kanban view toggle and persist preference in localStorage.
- [x] Reuse same card language between list and kanban.

Acceptance:
- App remains scannable on both 13-inch and large monitors.

### 9) Application list redesign
- [x] Show layered information hierarchy per row:
- [x] Primary: company + role.
- [x] Secondary: source + date.
- [x] Tertiary: inactivity attention signal.
- [x] Add left-border amber attention indicator for stale items (>14 days without status update).
- [x] Add deterministic company avatar tile color based on company name hash.
- [x] Use initials fallback and optional Clearbit logo if available.
- [x] Reveal edit/open-url action buttons on hover only.
- [x] Keep sort controls in filter bar (no drag reorder in list mode).

Acceptance:
- Row stays dense/scannable while still exposing key context.

### 10) Search quality improvements
- [x] Keep instant search behavior (already started in Phase 4) and tune responsiveness.
- [ ] Expand search scope to include recruiter/contact fields once available.
- [x] Add hit highlighting on matched text.
- [x] Add helpful zero-results quick-add state.
- [x] Add shortcuts: `/` and `Cmd+K` focus search.
- [x] Show subtle keyboard hint near search until first usage.

Acceptance:
- User can find items quickly and verify matches visually.

---

## P2 - Mobile, polish, and delight

### 11) Motion and micro-interactions
- [~] Add purposeful motion only for state changes:
- [x] New row enter animation.
- [ ] Delete fade + collapse.
- [x] Badge color transition.
- [x] Drawer slide in/out.
- [x] Pipeline segment resize animation.
- [x] Import bar expand/collapse animation.
- [x] Define default/hover/active states for all interactive controls.
- [x] Avoid decorative looping animations and positional hover shifts.

Acceptance:
- Motion communicates changes without feeling noisy.

### 12) Empty states
- [x] Build first-run empty state centered around import bar.
- [x] Add example URL chips that auto-populate and trigger extraction.
- [x] Build filtered empty state with contextual instructional message.
- [x] Build search empty state with quick-add conversion path.

Acceptance:
- Empty screens guide action instead of feeling dead.

### 13) Keyboard navigation and focus
- [x] Implement row keyboard navigation (up/down).
- [x] Enter opens drawer, Escape closes drawer.
- [x] `s` opens status picker, `n` focuses notes in drawer.
- [x] Show discoverable shortcut hints on row hover/focus.
- [~] Ensure tab order matches reading order.
- [x] Add visible custom focus ring (2px + offset).

Acceptance:
- Core list + detail flow is usable without a mouse.

### 14) Mobile experience
- [x] Replace sidebar with bottom nav below 640px.
- [x] Collapse pipeline display for mobile, tap to expand details.
- [x] Increase row touch height (target at least 56px visual row).
- [x] Convert desktop drawer to full-screen bottom sheet.
- [x] Make sheet dismissable by swipe-down or scrim tap.
- [x] Make import action easy on mobile (FAB or pinned action).
- [ ] Plan share-sheet integration as later mobile extension.

Acceptance:
- Mobile add/edit/read flows are thumb-friendly and uninterrupted.

---

## P3 - Reliability, trust, and retention

### 15) Accessibility hardening
- [ ] Verify WCAG AA contrast for all status + text combinations (light and dark).
- [ ] Ensure color is never the only status indicator.
- [ ] Ensure minimum 44x44 touch targets on mobile.
- [ ] Add alt text for logos/images.
- [ ] Add aria-label for icon buttons.
- [ ] Add dialog semantics for detail drawer.
- [ ] Add accessible label/description for pipeline visualization.
- [ ] Show field-level validation errors next to inputs.

Acceptance:
- Accessibility checks pass for keyboard, contrast, and semantics.

### 16) Performance and perceived speed
- [ ] Add virtualization for large lists (50+ items).
- [ ] Add skeleton loaders matching real layout.
- [ ] Cache latest application list in localStorage.
- [ ] Render cached data instantly on load, then refresh in background.
- [ ] Update only changed rows after fresh fetch.

Acceptance:
- Return visits feel instant and large lists remain smooth.

### 17) Notifications and reminders
- [ ] Add delayed permission prompt only after meaningful usage (e.g., 3 applications).
- [ ] Implement reminder rules:
- [ ] No new apps in 7 days.
- [ ] Interview stale for 5 days.
- [ ] Offer stale for 10 days.
- [ ] Add preferences panel in settings.
- [ ] Ensure one-click unsubscribe in notification emails.

Acceptance:
- Reminders are useful, respectful, and configurable.

### 18) Onboarding and trust features
- [ ] Build lightweight 3-step tooltip tour (skippable).
- [ ] Seed one clearly labeled example row for first-time clarity.
- [ ] Add delayed welcome email with deep link to import flow.
- [ ] Add CSV export in settings for full user data.

Acceptance:
- First-run experience is guided and users trust data portability.

---

## Suggested Phase 5 delivery slices

### Slice A (1-2 weeks)
- P0 items 1-3 (import bar, optimistic updates, quick status actions)

### Slice B (1-2 weeks)
- P0 items 4-5 + P1 item 6 (detail drawer, pipeline bar, token foundation)

### Slice C (1-2 weeks)
- P1 items 7-10 (typography, layout, list redesign, search polish)

### Slice D (1-2 weeks)
- P2 items 11-14 (motion, empty states, keyboard, mobile)

### Slice E (1-2 weeks)
- P3 items 15-18 (a11y, performance, reminders, onboarding, export)

---

## Definition of Done for Phase 5
- [ ] New UI uses token system and supports both light/dark themes.
- [ ] Dashboard supports fast add, fast status change, and split-pane detail workflows.
- [ ] Pipeline health and search/filter interactions feel immediate.
- [ ] Mobile, accessibility, and keyboard flows are production-usable.
- [ ] Perceived performance improvements are measurable and verified.
