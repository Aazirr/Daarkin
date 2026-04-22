# Phase 10 Home Dashboard Implementation Plan

## Purpose

Translate the Phase 10 Home concept into an execution plan.

This document defines:

- implementation phases
- delivery slices
- technical approach
- current status

## Execution Model

We use:

- **phases** for product milestones
- **slices** for delivery chunks inside those phases

## Phase 10 Implementation Phases

### Phase 10A: Guided Home Foundation

Goal:

- establish the new signed-in Home experience
- make Home the default post-login destination
- reposition the old dashboard as `Applications`

Status:

- implemented

Delivered:

- `Home` screen
- default signed-in landing on `Home`
- updated shell/navigation
- initial stats, activity, reminders, aging panel, actions
- compact quick import handoff

### Phase 10B: Guidance and Reminder Quality

Goal:

- make Home guidance more precise and actionable

Status:

- in progress

Delivered so far:

- guided navigation intents from Home into Applications
- focused Applications views for:
  - follow-ups
  - stale interviews
  - active pipeline
  - applications created today
  - aging buckets
- guided-state banner and clearer state messaging in Applications

Still to do:

- refine reminder heuristics
- improve follow-up prioritization
- make guided states more explicit in the Applications UI

### Phase 10C: Upcoming Event Intelligence

Goal:

- support true time-based reminders such as interviews happening today or tomorrow

Status:

- not started

Dependencies:

- structured event/interview data
- event editing UI
- event-aware reminder logic

### Phase 10D: Applications Workspace Refinement

Goal:

- fully embrace Applications as the detailed management workspace

Status:

- not started

Likely focus:

- guided-state chips or filter chips
- stronger Applications hierarchy
- better workspace empty states
- optional rename from `Dashboard.jsx` to `Applications.jsx`

## Recommended Order

1. Phase 10A
2. Phase 10B
3. Phase 10C
4. Phase 10D

## Technical Approach

### Routing

Current recommendation:

- continue using app-level view state for now
- keep `home`, `applications`, and `offers` as top-level signed-in views
- keep `Board` as Applications with kanban mode

Do not block Phase 10 on full client-side routing.

### Data Strategy

Version one:

- derive Home data client-side from the existing applications fetch

Later if needed:

- add a dedicated summary endpoint such as `GET /api/home-summary`

### State Handoff

Use lightweight navigation intent from `Home` into `Applications`, including:

- target view
- list or kanban mode
- import seed text
- status filter
- guided focus mode

### Reuse

Reuse existing:

- auth/session restore
- shell styling and navigation patterns
- applications fetch logic
- reminder derivation where practical
- import parsing/extraction flow
- offers workspace

Avoid duplicating:

- full import UI
- full Applications workspace on Home
- notes/compensation/detail flows

## Delivery Slices

### Slice 1: Routing and Shell Foundation

- add `Home`
- change signed-in default landing
- update shell navigation

Status:

- done

### Slice 2: Home Structure

- greeting
- stats
- actions
- initial layout

Status:

- done

### Slice 3: Insight Modules

- activity chart
- aging panel
- initial reminders

Status:

- done

### Slice 4: Quick Import Handoff

- compact Home quick import
- route into Applications import flow

Status:

- done

### Slice 5: Guidance Refinement

- precise stat/reminder routing
- Applications guided review states
- clearer messaging for guided flows

Status:

- in progress

### Slice 6: Event Intelligence

- today/tomorrow reminders
- event-driven urgency cards

Status:

- not started

## Testing

Protect these behaviors:

- authenticated users land on Home
- Home cards and actions route correctly
- quick import still hands off into Applications
- Applications guided states filter correctly
- offers navigation still works

## Risks

- Home becomes another crowded dashboard
- reminder quality overpromises what the data supports
- app-level navigation intent grows too complex

## Current File Surface

Primary files:

- [apps/web/src/App.tsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/App.tsx>)
- [apps/web/src/Home.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Home.jsx>)
- [apps/web/src/Dashboard.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Dashboard.jsx>)
- [apps/web/src/Offers.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Offers.jsx>)
- [apps/web/src/styles.css](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/styles.css>)

Tests:

- [apps/web/src/App.test.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/App.test.jsx>)
- [apps/web/src/Home.test.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Home.test.jsx>)
- [apps/web/src/Dashboard.test.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Dashboard.test.jsx>)

## Definition of Done

Phase 10 is done when:

- Home is the default signed-in landing experience
- Home provides meaningful guidance before detailed management
- Applications remains the detailed workspace
- reminders and action cards lead into useful workflows
- time-based event intelligence is supported where intended
