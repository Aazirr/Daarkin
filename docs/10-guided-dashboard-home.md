# Phase 10: Guided Dashboard Home

## Goal

Make the first signed-in screen feel like a briefing instead of a workspace.

After login, Daarkin should help the user answer:

- What happened recently?
- What needs attention now?
- What is coming up next?
- What should I do next?

The application list, board, and detail workflows should still exist, but they should become destination workspaces rather than the default landing screen.

## Problem

Daarkin currently opens directly into a dense management view with:

- application list
- filters and sorting
- pipeline controls
- import/extraction UI
- detail workflows

That is efficient for power users, but overwhelming as the default first impression.

## Product Direction

Introduce a signed-in `Home` experience that acts like a job-search briefing dashboard.

`Home` should:

- orient the user quickly
- surface momentum and urgency
- suggest the next best actions
- hand off into `Applications`, `Board`, or `Offers`

`Applications` should remain the detailed management workspace for:

- filtering
- sorting
- notes
- compensation
- status changes
- import workflows

## UX Principles

- brief before browse
- guide before overwhelm
- make insights actionable
- preserve fast workflows
- keep Home lighter than Applications

## Home Content Model

The Home screen should include:

1. greeting and summary
2. top-level stats
3. activity graph
4. aging/follow-up insight
5. reminders
6. recommended actions
7. compact quick import

## Navigation Model

Recommended signed-in destinations:

- `Home`
- `Applications`
- `Board`
- `Offers`
- `Settings`

Recommended behavior:

- login redirects to `Home`
- current dashboard becomes `Applications`
- `Board` remains the kanban-oriented workflow

## Scope

### In scope

- new signed-in Home view
- Home as the default post-login destination
- summary stats
- activity insight
- aging/follow-up insight
- reminder modules
- action entry points
- compact quick import
- updated navigation

### Out of scope for first release

- full replacement of Applications
- advanced analytics
- forecasting/scoring beyond current needs
- structured interview scheduling if the data model does not exist yet

## Data Reality

Available now:

- application status
- created date
- applied date
- updated date
- status changed date

Not yet reliable enough for full reminder intelligence:

- interview dates/times
- dedicated due dates
- event-based reminder objects

## Delivery Shape

### Phase 10A: Guided Home Foundation

- Home route and nav entry
- new default post-login destination
- initial stats, activity, actions, and import handoff

### Phase 10B: Guidance and Reminder Quality

- better follow-up logic
- more precise handoff into Applications
- stronger reminder usefulness

### Phase 10C: Upcoming Event Intelligence

- interview today/tomorrow reminders
- event-aware urgency cards once structured event data exists

## Success Criteria

Phase 10 is successful if:

- users understand search state immediately after login
- Home feels calmer than Applications
- reminders are visible without opening the list
- users can still reach management workflows quickly
- the app feels like it helps prioritize work, not just store records

## Related Docs

- [11-home-wireframe-spec.md](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/docs/11-home-wireframe-spec.md>)
- [12-home-implementation-plan.md](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/docs/12-home-implementation-plan.md>)
