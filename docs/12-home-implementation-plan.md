# Phase 10 Home Dashboard Implementation Plan

## Purpose

This document converts the Phase 10 guided Home concept into an implementation plan for Daarkin.

It defines:

- what needs to change in the app structure
- what can be reused
- what new frontend modules are required
- what data rules power each module
- what should be built first

This plan assumes the current dense dashboard becomes the `Applications` workspace, while a new `Home` screen becomes the default post-login experience.

## Implementation Goal

Deliver a new signed-in `Home` experience that:

- becomes the default first screen after login
- gives users a calm, guided overview of their search
- surfaces urgency, momentum, and next actions
- keeps current power-user management flows available one click away

## Product Transition Summary

### Current state

- authenticated users land directly in the current dashboard
- that view mixes overview, import, filtering, list management, and detail workflows in one page

### Target state

- authenticated users land in `Home`
- `Home` focuses on orientation, reminders, and next actions
- current dashboard is renamed or repositioned as `Applications`
- import, list management, detail drawer, and filters remain in `Applications`

## Scope Summary

### In scope

- add a new `Home` route/view
- update app routing and navigation labels
- make `Home` the default login destination
- refactor the current dashboard into the `Applications` workspace
- create summary modules for stats, activity, reminders, aging, and action shortcuts
- add compact quick import handoff from `Home` to `Applications`

### Not in scope for first release

- redesigning every existing application-management interaction
- adding a brand-new backend analytics service unless needed
- building a complete interview scheduling subsystem
- replacing the offers workflow

## Architecture Strategy

## 1. Route Model

### Recommended route structure

- `Home`
- `Applications`
- `Board`
- `Offers`
- `Settings`

### Practical app-level implementation

The current app uses view state instead of a full router. For Phase 10, there are two reasonable implementation paths.

### Option A: Expand current view-state routing

Add a new current view state and keep the existing lightweight in-app routing pattern.

Example conceptual states:

- `home`
- `applications`
- `offers`

Potential board handling:
- `applications` with `viewMode = kanban`
- or separate `board` state if clarity is better

Advantages:
- lowest implementation cost
- minimal disruption to current app structure
- good fit if app navigation remains modest

Tradeoffs:
- deep-linking becomes harder as the product grows
- navigation logic will continue to accumulate in `App.tsx`

### Option B: Introduce a real client router

Add React Router and formalize route-based navigation.

Advantages:
- better long-term structure
- cleaner navigation model
- easier deep-linking and route-based state

Tradeoffs:
- larger change surface
- more migration work now

### Recommendation

For Phase 10, use **Option A** unless we intentionally want to invest in route infrastructure now.

That means:

- add a `home` view
- rename the current dashboard workspace conceptually to `applications`
- keep `offers` as a separate view
- treat kanban as either a mode inside `applications` or a dedicated `board` view later

## 2. Existing Components and Logic To Reuse

### Reuse directly

- auth/session restore flow in [App.tsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/App.tsx>)
- sidebar shell and mobile navigation styling in [styles.css](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/styles.css>)
- application fetching and status counts logic from [Dashboard.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Dashboard.jsx>)
- reminder generation logic already present in `buildReminderCards`
- existing quick import parse/extract flow in `Dashboard.jsx`
- offers workspace in [Offers.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Offers.jsx>)

### Reuse with extraction/refactor

- pipeline metrics derivation
- stale/follow-up logic
- mobile nav button patterns
- settings entry point
- cached application data logic

### Do not duplicate

- full import workflow
- full applications list and detail drawer
- compensation and notes flows
- existing offer-comparison flows

## Frontend Component Plan

## 1. New top-level screen

Create a new signed-in screen component:

- `apps/web/src/Home.jsx`

Responsibilities:

- fetch or receive summary-ready application data
- compute Home-level stats and sections
- render a calmer overview experience
- hand off into existing workspaces

## 2. New Home modules

Recommended initial components:

- `HomeHeader.jsx`
- `HomeStatsGrid.jsx`
- `HomeActivityChart.jsx`
- `HomeRemindersPanel.jsx`
- `HomeAgingPanel.jsx`
- `HomeActionCards.jsx`
- `HomeQuickImport.jsx`

These can live under:

- `apps/web/src/components/home/`

### Component responsibilities

#### `HomeHeader`

- greeting
- summary sentence
- optional urgency message

#### `HomeStatsGrid`

- stat cards
- click navigation to filtered destinations

#### `HomeActivityChart`

- show recent applications activity
- optionally support 7-day / 30-day toggle later

#### `HomeRemindersPanel`

- show top priority reminders
- route to relevant applications/offers actions

#### `HomeAgingPanel`

- show aging buckets
- route to filtered applications lists

#### `HomeActionCards`

- visible navigation shortcuts
- low-cognitive-load next steps

#### `HomeQuickImport`

- compact input only
- routes user into `Applications` with import intent

## 3. Applications workspace refactor

The current `Dashboard.jsx` should remain the management workspace, but it should be conceptually reintroduced as:

- `Applications`

Recommended first step:

- keep filename as `Dashboard.jsx` temporarily to reduce churn
- change user-facing labels from `Dashboard` to `Applications`
- update app-level view switching accordingly

Optional later refactor:

- rename file to `Applications.jsx`

## Data Strategy

## 1. Data source approach

For Phase 10 version one, the Home screen should derive most data from the existing applications fetch rather than depending on new backend endpoints immediately.

### Version one data approach

- fetch applications using the existing applications API
- derive Home metrics client-side
- use cached application data when practical for fast load

Advantages:

- faster implementation
- minimal backend work
- reuses proven application data contract

Tradeoffs:

- more client-side derivation logic
- less efficient if the dataset grows very large

### Version two data approach

If needed later, add a dedicated summary endpoint such as:

- `GET /api/home-summary`

That endpoint could return:

- stat cards
- activity series
- reminder data
- aging buckets

Recommendation:

Do **not** block Phase 10 on a new backend summary endpoint.

## 2. Home metric derivation rules

### Applications Today

Definition:
- count applications with `createdAt` or `appliedAt` equal to today

Suggested rule:
- prefer `createdAt` for captured-in-system activity
- optionally treat `appliedAt` as primary if the product meaning should reflect actual submission date

Recommendation:
- use `createdAt` in version one for simplicity and consistency

### Active Pipeline

Definition:
- count applications not in terminal inactive state

Suggested version-one rule:
- include `applied`, `interview`, `offer`
- exclude `rejected`

### Interviews

Definition:
- count applications with `status === interview`

Version-one note:
- this is stage-based, not schedule-based

### Offers

Definition:
- count applications with `status === offer`

### Needs Follow-Up

Definition:
- count applications that are stale by age or inactivity

Suggested version-one rule:
- status is `applied` or `interview`
- and `updatedAt` or `statusChangedAt` is older than threshold

Recommended thresholds:
- `interview`: stale after 5 days
- `applied`: stale after 7 to 14 days

Recommendation:
- use one simple threshold first for implementation clarity

### Aging Buckets

Definition:
- applications grouped by elapsed time since `createdAt` or `appliedAt`

Recommended rule:
- use `createdAt` for version one unless product semantics require otherwise

Buckets:
- 1 week old: 7 to 13 days
- 2 weeks old: 14 to 20 days
- 3+ weeks old: 21+ days

Optional exclusion:
- exclude `rejected`

Recommendation:
- exclude `rejected` from follow-up-focused aging buckets

### Activity Chart

Definition:
- number of applications created per day across last 7 days

Recommendation:
- ship 7-day chart first
- add 30-day mode only if still visually clean

### Reminder Cards

Version-one reminder sources:
- no new applications in X days
- stale interview
- stale offer
- aging applications threshold reached

Version-two reminder sources:
- interview today
- interview tomorrow
- event-driven reminders

## Navigation and Action Mapping

## 1. Sidebar updates

Update desktop sidebar labels to:

- `Home`
- `Applications`
- `Board`
- `Offers`
- `Settings`

### Version-one handling

If `Board` is still just kanban mode inside `Dashboard.jsx`, clicking `Board` should:

- switch to the applications workspace
- set `dashboardViewMode = kanban`

If `Applications` is clicked:

- switch to the applications workspace
- set `dashboardViewMode = list`

## 2. Mobile bottom navigation

Update mobile bottom nav to reflect the same mental model:

- `Home`
- `Applications`
- `Board`
- `Offers`

Settings can remain:

- a separate control
- or accessible from Home/App header

Recommendation:
- keep the mobile nav focused on primary destinations and avoid overcrowding

## 3. Home CTA behavior

### `View Applications`

- switches to `applications`
- sets list mode

### `Save an Application`

- switches to `applications`
- scrolls or focuses the add/import section

### `Review Follow-Ups`

- switches to `applications`
- applies stale/follow-up filter

### `Check Offers`

- switches to `offers`

### Quick Import submit

- switches to `applications`
- preloads import input with submitted text
- focuses import review flow

## State Handoff Requirements

Because the app currently uses view state rather than route params, Home-to-Applications actions will need a lightweight handoff mechanism.

### Recommended version-one mechanism

Use transient local state in `App.tsx` for navigation intent.

Possible handoff payload:

- target view
- desired applications mode (`list` or `kanban`)
- optional import seed text
- optional preset filter
- optional focus target

Example intent types:

- `open-import`
- `open-follow-ups`
- `open-offers`
- `open-board`

### Why this is preferred

- minimal infrastructure
- enough for Home-to-workspace actions
- avoids overcomplicating Phase 10

## Styling and Design Plan

## 1. Visual direction

The Home screen should use the existing warm-dark design system, but with a calmer page rhythm than the Applications workspace.

That means:

- fewer dense controls above the fold
- clearer spacing between modules
- stronger top-level hierarchy
- more breathing room around stats and reminders

## 2. Reuse existing tokens

Continue using tokens from [07-design-system.md](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/docs/07-design-system.md>) and `styles.css`.

Add only what is needed:

- chart surface styling
- stat card styles
- action card styles
- reminder emphasis variants

## 3. Home-specific component styling guidance

### Stat cards

- compact
- strong numeric hierarchy
- subtle hover affordance

### Reminder cards

- visually prioritized over generic info cards
- use urgency through tone and contrast, not loud error-red by default

### Action cards

- simple and obvious
- large enough to feel like guided choices

### Quick import

- compact and subordinate to the rest of Home
- visibly available, not visually dominant

## Testing Plan

## 1. Frontend behavior tests

Add tests for:

- authenticated app lands on `Home`
- Home renders stats and summary from mocked application data
- clicking action cards routes into the intended workspace
- Quick Import on Home hands off to Applications with prefilled input
- aging bucket CTAs apply the expected filtered view
- mobile navigation still reaches all primary destinations

Suggested file additions:

- `apps/web/src/Home.test.jsx`
- updates to `App.test.jsx`

## 2. Regression test focus

Protect existing behaviors:

- applications list loads correctly
- quick import still works after handoff
- offers navigation still works
- session restore still lands in correct signed-in view

## 3. Optional later tests

- chart derivation correctness
- reminder priority ordering
- stale/follow-up logic derivation

## Rollout Plan

## Slice 1: Routing and shell foundation

- add `Home` view state to `App.tsx`
- update post-login destination to `Home`
- update sidebar labels and navigation handlers
- update mobile navigation model

Deliverable:
- user can log in and land on a placeholder `Home` screen

## Slice 2: Home screen structure

- create `Home.jsx`
- build greeting header
- build top stat cards
- build action cards
- wire navigation actions to existing workspaces

Deliverable:
- Home becomes a functional briefing page even before advanced insights ship

## Slice 3: Insight modules

- add activity chart
- add aging panel
- add reminder panel using available reminder logic

Deliverable:
- Home communicates state, urgency, and momentum

## Slice 4: Quick import handoff

- add compact Home quick import field
- implement handoff into Applications import flow
- focus/scroll import area on arrival

Deliverable:
- users can start capture from Home without cluttering Home with the full import workflow

## Slice 5: Refinement and test coverage

- improve copy
- polish spacing and hierarchy
- add tests
- verify mobile layout and responsiveness

Deliverable:
- production-usable Home experience with regression protection

## Risks and Mitigations

## Risk 1: Home becomes another crowded dashboard

Mitigation:
- keep Home focused on briefing and action entry
- do not port the full applications workspace onto Home

## Risk 2: Import flow duplication creates maintenance overhead

Mitigation:
- use Home as a handoff to Applications instead of recreating full extraction UI there

## Risk 3: Reminder promises exceed actual data quality

Mitigation:
- ship reminders based on data that exists now
- defer interview-date reminders until event data is reliable

## Risk 4: App-level view state gets harder to manage

Mitigation:
- centralize navigation intent in `App.tsx`
- keep handoff payload small and explicit
- consider real routing later if complexity grows

## Risk 5: Metric definitions confuse users

Mitigation:
- define version-one metrics clearly and keep them stable
- prefer simple labels and avoid ambiguous analytics terms

## File-Level Implementation Checklist

### Likely files to update

- [apps/web/src/App.tsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/App.tsx>)
- [apps/web/src/Dashboard.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Dashboard.jsx>)
- [apps/web/src/Offers.jsx](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/Offers.jsx>)
- [apps/web/src/styles.css](</c:/Users/Franz Jason Dolores/Documents/Work/Projects/Personal/Daarkin/apps/web/src/styles.css>)

### Likely new files

- `apps/web/src/Home.jsx`
- `apps/web/src/components/home/HomeHeader.jsx`
- `apps/web/src/components/home/HomeStatsGrid.jsx`
- `apps/web/src/components/home/HomeActivityChart.jsx`
- `apps/web/src/components/home/HomeRemindersPanel.jsx`
- `apps/web/src/components/home/HomeAgingPanel.jsx`
- `apps/web/src/components/home/HomeActionCards.jsx`
- `apps/web/src/components/home/HomeQuickImport.jsx`
- `apps/web/src/Home.test.jsx`

## Definition of Done

Phase 10 implementation is done when:

- authenticated users land on `Home`
- Home provides a clear guided overview before detailed management
- users can reach `Applications`, `Board`, `Offers`, and primary actions directly
- Home shows meaningful stats and reminders using current data
- compact quick import successfully hands off into the Applications workflow
- current power-user features remain intact
- regression tests cover the new navigation and Home behavior

## Recommended Immediate Next Action

Start with **Slice 1 and Slice 2 only**.

That gives Daarkin the most important UX win quickly:

- a calmer first screen
- better navigation framing
- clearer next actions

Then layer in charts, aging, reminders, and quick import handoff once the shell is stable.
