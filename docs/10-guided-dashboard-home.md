# Phase 10: Guided Dashboard Home

## Goal

Shift the first logged-in experience from an operations-heavy application list into a guided home dashboard that helps the user understand:

- what happened recently
- what needs attention now
- what is coming up next
- where to go next inside the app

The dashboard should feel like a helpful briefing, not a wall of controls.

## Problem Statement

Daarkin currently opens directly into a power-user workspace. The user is immediately presented with:

- the application list
- filters and sorting
- pipeline controls
- the extraction/import area
- detail workflows

This works for experienced repeat usage, but it is overwhelming as the default landing state after login.

The current dashboard asks the user to operate the system before the system helps them orient themselves.

That creates three UX issues:

1. The first screen is cognitively dense.
2. Important reminders and context are buried inside the broader workspace.
3. The app does not clearly guide the user toward the next best action.

## Product Direction

After login, Daarkin should first behave like a personal job search briefing dashboard.

Instead of opening directly into "all applications", the app should open into a guided overview page that answers:

- How is my search going today?
- What applications are aging and may need follow-up?
- Do I have anything urgent today or tomorrow?
- What should I do next?
- Where do I go to manage applications or add a new one?

The application list, kanban view, and detailed management workflows should still exist, but they should become destination workspaces rather than the default first impression.

## Primary UX Outcome

When a user logs in, they should be able to understand their current job-search state in less than 10 seconds and see 1 to 3 obvious next actions without scanning the full application database.

## User Experience Principles

### 1) Brief before browse

The user should receive a summary before being asked to manage records.

### 2) Guide before overwhelm

The home experience should highlight what matters now instead of exposing every control at once.

### 3) Actionable, not decorative

Statistics, graphs, and reminders should point toward useful actions, not just display information.

### 4) Encourage momentum

The interface should nudge the user toward productive next steps such as:

- viewing applications that need follow-up
- adding a new application
- importing from a URL
- checking upcoming interviews

### 5) Preserve power workflows

This new guided home should not remove the current fast-management tools. It should sequence them better.

## Proposed Information Architecture

### New default first screen after login

Introduce a dedicated home dashboard as the default signed-in route.

Suggested top-level destinations:

- `Home`
- `Applications`
- `Board`
- `Offers`
- `Settings`

### Home dashboard responsibilities

The Home screen should answer orientation and prioritization questions.

The Applications screen should remain the dense management workspace for:

- filtering
- sorting
- status changes
- detailed review
- notes
- compensation
- quick import workflows

## Home Dashboard Content Model

### 1) Greeting and summary header

Purpose:
- create a calm first moment
- make the dashboard feel personal
- frame the current search state

Example content:
- greeting by time of day
- brief summary sentence
- small date context

Example UX copy:
- "Good morning. Here is your search snapshot."
- "You have 2 applications needing attention and 1 interview coming up."

### 2) Top-level stat cards

Purpose:
- provide immediate orientation
- surface useful metrics without requiring navigation

Initial candidate metrics:
- applications added today
- active applications
- interviews in progress
- offers on hand
- applications older than 1 week
- applications older than 2 weeks
- applications older than 3 weeks

Notes:
- avoid flooding the top row with too many numbers
- prefer 3 to 5 high-signal stats first
- aging metrics may work better in a dedicated "aging" module instead of all living in the top row

### 3) Search activity graph

Purpose:
- show momentum and consistency
- help the user visually understand whether their search is active, slowing down, or stalled

Candidate visualizations:
- applications submitted per day over the last 7 days
- applications submitted per week over the last 6 to 8 weeks
- status movement trend over time

Recommended first version:
- a simple applications-per-day or applications-per-week trend chart

### 4) Aging applications insight

Purpose:
- identify neglected items
- make follow-up debt visible

Candidate breakdown:
- 1 week old
- 2 weeks old
- 3+ weeks old

Recommended behavior:
- clicking an aging bucket should navigate to filtered applications
- copy should frame this as follow-up opportunity, not just stale backlog

Example:
- "3 applications are now 2 weeks old"
- CTA: `Review Follow-Ups`

### 5) Upcoming reminders

Purpose:
- surface urgent or time-sensitive events immediately

Initial reminder types:
- interview today
- interview tomorrow
- offer decision follow-up
- stale interview with no update
- no applications added recently

Important note:
- interview reminders require interview/event data to exist in a structured way; if that data model is not yet complete, this module may launch with partial support

### 6) Recommended next actions

Purpose:
- reduce ambiguity
- give the user a guided path forward

Suggested action cards or buttons:
- `View Applications`
- `Save an Application`
- `Quick Import`
- `Review Follow-Ups`
- `Check Offers`

This section is critical. It turns Daarkin from a passive tracker into an active guide.

### 7) Quick Import on Home

Purpose:
- keep the fastest add flow accessible without forcing the entire applications workspace on first load

Recommended behavior:
- retain a compact quick import field on the Home screen
- accept URL or company name
- on submit, either:
  - complete the import inline if the interaction is simple enough, or
  - route the user into the Applications workspace with the import flow already active

Key principle:
- import should remain easy to reach, but it should no longer dominate the whole dashboard by default

## Proposed Home Layout

Recommended page order:

1. Greeting and summary
2. Key stats row
3. Primary graph or activity trend
4. Reminder and aging sections
5. Recommended next actions
6. Compact quick import

This order keeps the page focused on:

- orientation first
- insight second
- action third

## Navigation Changes

To support this UX, Daarkin should stop treating the current dashboard as the universal landing page.

Recommended navigation update:

- current dashboard becomes `Applications`
- new guided overview becomes `Home`
- login redirects to `Home`
- sidebar and mobile nav expose both `Home` and `Applications`

This preserves the current application management workflow while giving the product a more welcoming and guided default experience.

## Functional Scope

### In scope for Phase 10

- add a new signed-in Home view
- make Home the default post-login destination
- add summary stats for recent search activity
- add graph-based activity insight
- add aging application insights
- add reminder modules for urgent/upcoming items
- add clear action entry points to major workflows
- add compact quick import entry on Home
- update navigation labels and routing

### Out of scope for first implementation

- full replacement of the Applications workspace
- advanced analytics beyond the initial graph and aging insights
- complex forecasting or scoring models
- new interview scheduling system if required backend data does not exist yet
- major redesign of every existing management component

## Data and Dependency Notes

This Home experience depends on what data Daarkin already stores versus what must be added.

### Likely available now

- total applications
- applications by status
- created date
- applied date
- updated date
- status changed date

### Likely partially available or not yet structured enough

- interview date and time
- reminders for specific scheduled events
- actionable follow-up due dates
- recruiter/contact-driven tasks

### Implication

Phase 10 should separate:

- dashboard insights we can build immediately from existing application data
- reminder experiences that require new data fields or event models

## Suggested Delivery Strategy

### Phase 10A: Guided Home foundation

- create Home route and navigation entry
- move current dashboard workspace under `Applications`
- build greeting and summary header
- build top-level stats
- build simple activity graph
- add primary action cards
- add compact quick import

### Phase 10B: Guidance and reminders

- add aging applications module
- add recommendation logic for next-best actions
- add "lacking momentum" reminders
- add filtered deep links into Applications

### Phase 10C: Upcoming event intelligence

- add upcoming interview reminders
- add time-based event cards for today and tomorrow
- expand reminder quality once event data is structured reliably

## UX Success Criteria

Phase 10 is successful if:

- users understand their search state immediately after login
- the first screen feels calmer and more guided than the current dashboard
- important reminders are visible without opening the applications list
- users can still quickly reach application management flows
- the app feels like it is helping prioritize work, not just storing entries

## Open Questions

These should be answered before implementation begins:

1. Should Quick Import on Home remain inline, or should it hand off into Applications after paste?
2. What exact event model will power "interview today/tomorrow" reminders?
3. Which 3 to 5 stats are highest value for the first release?
4. Should Home be customizable later, or remain opinionated and fixed?
5. Should first-time users see a lighter onboarding version of Home than returning users?

## Recommended Next Step

Before coding, create a low-fidelity content wireframe for the new `Home` screen and map each module to:

- existing data sources
- missing data requirements
- destination routes or actions

That will let implementation stay grounded in real app capabilities rather than a purely visual redesign.
