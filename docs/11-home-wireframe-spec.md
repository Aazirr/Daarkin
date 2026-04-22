# Phase 10 Home Screen Wireframe Spec

## Purpose

This document translates `docs/10-guided-dashboard-home.md` into a low-fidelity, implementation-oriented wireframe specification for the new signed-in `Home` experience.

The goal is not visual polish yet.

The goal is to define:

- what appears on the Home screen
- in what order it appears
- what each section communicates
- where each action sends the user
- what data each section needs

## Screen Intent

The Home screen should act like a daily search briefing.

When the user logs in, this page should answer:

- What is the state of my search right now?
- What needs attention today?
- What is coming up next?
- What should I do next?

The user should not need to scan the applications list to answer those questions.

## Route and Navigation Model

### Default route after login

- Redirect authenticated users to `Home`

### Signed-in navigation

- `Home`
- `Applications`
- `Board`
- `Offers`
- `Settings`

### Navigation behavior

- `Home` is the default briefing page
- `Applications` is the management workspace
- `Board` remains the kanban-oriented workflow
- `Offers` remains the comparison workspace
- `Settings` remains preferences and export

## Desktop Wireframe

```text
+--------------------------------------------------------------------------------------+
| Sidebar | Home                                                                       |
|         |--------------------------------------------------------------------------- |
|         | Good morning, Franz                                                        |
|         | Here is your search snapshot for today.                                    |
|         | 2 items need attention · 1 interview tomorrow                              |
|         |--------------------------------------------------------------------------- |
|         | [Stat] Applications Today  [Stat] Active Pipeline  [Stat] Interviews       |
|         | [Stat] Offers               [Stat] Follow-Up Needed                         |
|         |--------------------------------------------------------------------------- |
|         | Search Activity Graph                               | Upcoming / Reminders  |
|         | Applications submitted over 7 or 30 days           | - Interview tomorrow  |
|         |                                                    | - 3 stale applications|
|         |                                                    | - No new apps in 4 d  |
|         |--------------------------------------------------------------------------- |
|         | Aging Applications                                  | Recommended Actions  |
|         | 1 week | 2 weeks | 3+ weeks                         | [View Applications]  |
|         | each bucket clickable                               | [Save Application]   |
|         |                                                     | [Review Follow-Ups]  |
|         |                                                     | [Check Offers]       |
|         |--------------------------------------------------------------------------- |
|         | Quick Import                                                                  |
|         | [ Paste URL or company name............................................. ]  |
|         | [ Import ]  [Open Full Workspace]                                          |
+--------------------------------------------------------------------------------------+
```

## Mobile Wireframe

```text
+----------------------------------+
| Home                             |
| Good morning                     |
| Search snapshot for today        |
|----------------------------------|
| Stat carousel or 2-col grid      |
| Applications Today | Active      |
| Interviews         | Follow-Ups  |
|----------------------------------|
| Upcoming / Reminders             |
| - Interview tomorrow             |
| - 3 items need follow-up         |
|----------------------------------|
| Activity Graph                   |
|----------------------------------|
| Aging Applications               |
| 1w | 2w | 3w+                    |
|----------------------------------|
| Recommended Actions              |
| [View Applications]              |
| [Save Application]               |
| [Quick Import]                   |
| [Check Offers]                   |
|----------------------------------|
| Quick Import                     |
| [ Paste URL or company name ]    |
| [ Import ]                       |
|----------------------------------|
| Bottom Nav                       |
+----------------------------------+
```

## Section-by-Section Specification

## 1. Greeting Header

### Purpose

- create a softer first moment after login
- orient the user in plain language
- summarize the state of the search

### Content

- time-of-day greeting
- user name or email-derived display name if available
- one or two short summary lines

### Example copy

- `Good morning, Franz`
- `Here is your search snapshot for today.`
- `2 items need attention and 1 interview is coming up tomorrow.`

### Behavior

- always visible at the top of Home
- summary sentence should adapt to available data
- if there are no urgent reminders, use a calmer progress-oriented summary

### Empty-state version

- `Welcome back. Let's build momentum today.`
- `You have no urgent reminders right now. Add or review applications to keep your search moving.`

### Data dependencies

- current time
- user name or email
- counts of urgent reminders
- counts of upcoming interviews if supported

## 2. Top Stat Row

### Purpose

- give immediate orientation through a few high-signal metrics
- avoid forcing the user into the application list to understand status

### Recommended first-release cards

- `Applications Today`
- `Active Pipeline`
- `Interviews`
- `Offers`
- `Needs Follow-Up`

### Definitions

- `Applications Today`: applications created or applied today
- `Active Pipeline`: applications not rejected and not closed
- `Interviews`: applications currently in interview stage
- `Offers`: applications currently in offer stage
- `Needs Follow-Up`: aging or stale items that cross the follow-up threshold

### Behavior

- each card should be clickable
- clicking a card routes to a filtered destination in `Applications`

### Destination mapping

- `Applications Today` -> `Applications` filtered to created/applied today
- `Active Pipeline` -> `Applications` filtered to active statuses
- `Interviews` -> `Applications` filtered to interview
- `Offers` -> `Offers` or `Applications` filtered to offer
- `Needs Follow-Up` -> `Applications` filtered to stale items

### Data dependencies

- applications list or summary endpoint
- created date
- applied date
- status
- updated date or status changed date

## 3. Search Activity Graph

### Purpose

- show whether the user's search has momentum
- visually answer whether recent activity is increasing, flat, or slowing

### Recommended first-release chart

- bar or line chart showing applications submitted across the last 7 days

### Optional alternate view

- toggle between `7 days` and `30 days`

### Supporting copy

- `Your activity this week`
- `You applied to 6 roles in the last 7 days`

### Behavior

- static insight first; interactivity second
- chart does not need full analytics controls in version one
- optional click on a bar can route to the corresponding filtered day view later

### Data dependencies

- application created or applied timestamps

## 4. Upcoming and Reminder Panel

### Purpose

- bring urgent or time-sensitive items into immediate view
- reduce the chance that the user misses interviews or neglects follow-ups

### Card types for first release

- interview today
- interview tomorrow
- stale interview with no update
- offer awaiting decision or update
- no new applications in X days

### Reminder priority order

1. interview today
2. interview tomorrow
3. urgent offer-related reminder
4. stale interview follow-up
5. no recent application activity

### Behavior

- show top 2 to 4 reminders only
- each reminder should include a direct CTA

### Example reminder rows

- `Interview tomorrow with Stripe`
- CTA: `Open Application`

- `3 applications are now 2+ weeks old`
- CTA: `Review Follow-Ups`

- `No new applications added in 5 days`
- CTA: `Add an Application`

### Empty state

- `No urgent reminders right now`
- `You're clear for today. Review your pipeline or add a new lead when ready.`

### Data dependencies

- reminder logic
- event dates if interview scheduling exists
- application age thresholds
- updated date

### Implementation note

If structured interview event data does not yet exist, version one should launch with aging and momentum reminders first, and add time-specific interview reminders later.

## 5. Aging Applications Module

### Purpose

- show the user which items may need follow-up
- make time decay visible in a compact way

### Structure

- three buckets:
  - `1 week old`
  - `2 weeks old`
  - `3+ weeks old`

### Recommended visual model

- three horizontal cards or segmented tiles
- each tile shows count and short supporting label

### Example content

- `1 Week`
- `4 applications`

- `2 Weeks`
- `3 applications`

- `3+ Weeks`
- `2 applications`

### Behavior

- each bucket is clickable
- click routes to `Applications` with the appropriate aging filter applied

### Data dependencies

- application age from created or applied date
- optional rule to exclude rejected or archived applications

### Product note

This module should emphasize opportunity for follow-up, not guilt. The copy should feel helpful, not punitive.

## 6. Recommended Actions

### Purpose

- provide the clearest possible next steps
- reduce ambiguity on what to do from Home

### Required actions

- `View Applications`
- `Save an Application`
- `Review Follow-Ups`
- `Check Offers`

### Optional action

- `Quick Import`

### Recommended behavior

- show as action cards or prominent buttons
- each action should include one short subtitle

### Example

- `View Applications`
- `Open your full pipeline workspace`

- `Save an Application`
- `Add a role manually or from a company name`

- `Review Follow-Ups`
- `See aging items and stale conversations`

- `Check Offers`
- `Compare active offers and compensation`

### Destination mapping

- `View Applications` -> `Applications`
- `Save an Application` -> `Applications` with add flow active
- `Review Follow-Ups` -> `Applications` with stale filters
- `Check Offers` -> `Offers`

### Data dependencies

- none required for static rendering
- optional dynamic badge counts can be added later

## 7. Compact Quick Import

### Purpose

- preserve Daarkin's fastest capture flow
- make adding a lead easy without taking over the whole screen

### Structure

- single input
- primary action button
- secondary link/button to open full Applications workspace

### Input placeholder

- `Paste a job URL or company name`

### Accepted inputs

- job URL
- company name
- pasted job text later if desired

### Behavior options

#### Option A: Inline handoff

- user pastes URL or company name on Home
- on submit, route to `Applications`
- keep import flow active there with prefilled draft

Recommended for first release because it avoids duplicating the full import UX on two screens.

#### Option B: Full inline import on Home

- extraction, review, and save happen directly on Home

This is more convenient but also more complex and risks making Home feel dense again.

### Recommendation

Use Option A first.

Home should initiate import, then hand off to `Applications` for full review/edit/save.

### Data dependencies

- existing import parsing flow
- route-state handoff or persisted draft mechanism

## Module Priority and Visual Hierarchy

### Highest emphasis

- Greeting header
- Top stats
- Upcoming reminders

### Medium emphasis

- Activity graph
- Aging module

### Lower emphasis

- Recommended actions
- Compact quick import

Important nuance:
`Lower emphasis` does not mean less important functionally. It means the user should first understand their state before choosing an action.

## Home Screen States

## State A: First-time or near-empty user

### Goal

- reduce intimidation
- encourage first action

### Emphasis

- greeting
- simple momentum messaging
- large action buttons
- quick import

### Reduced modules

- graph can show empty illustration or low-data message
- reminder module can collapse into encouragement
- aging module can be hidden if there is not enough data

### Example

- `You have not added any applications yet`
- CTA: `Save Your First Application`
- CTA: `Paste a Job URL`

## State B: Active user with normal pipeline

### Goal

- brief the user efficiently
- highlight reminders and trends

### Emphasis

- balanced layout with all modules visible

## State C: User with urgent reminders

### Goal

- immediately surface time-sensitive action

### Emphasis

- reminder panel moves higher visually
- summary line references urgency
- primary CTA points to the urgent item

## Data Mapping Table

| Module | Required Data | Likely Available Now | Notes |
|---|---|---|---|
| Greeting header | user identity, reminder summary | Partial | user identity exists, summary logic needed |
| Top stats | status counts, today count, stale count | Mostly yes | stale/follow-up logic needed |
| Activity graph | created/applied timestamps | Yes | can launch immediately |
| Upcoming reminders | event dates, stale logic | Partial | aging reminders available sooner than interview reminders |
| Aging module | age buckets from dates | Yes | can launch immediately |
| Recommended actions | route targets | Yes | low dependency |
| Compact quick import | import handoff state | Partial | existing import flow can be reused |

## Implementation Notes

### Reuse opportunities

- reuse existing sidebar and mobile bottom navigation
- reuse existing import parser and extraction flow
- reuse existing filtered application list as destination workspace
- reuse existing reminder logic where applicable

### Avoid in version one

- building a second full application-management surface on Home
- embedding too many filters or controls
- duplicating the full import UI on both Home and Applications
- introducing analytics complexity before the basic briefing model works

## Acceptance Criteria

The wireframe is considered successfully implemented when:

- login opens into `Home` instead of the current dense workspace
- users can understand their current search state in one glance
- users can see urgent reminders without opening `Applications`
- users can reach key workflows in one click
- Home feels lighter and more guided than `Applications`
- `Applications` remains the place for detailed pipeline management

## Recommended Next Step

Convert this wireframe spec into a UI implementation plan with:

- route changes
- component breakdown
- API/data requirements
- dashboard metric derivation rules
- phased frontend rollout steps
