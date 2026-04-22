# Phase 10 Home Screen Wireframe Spec

## Purpose

Define the low-fidelity structure of the signed-in `Home` experience.

This document focuses on:

- screen layout
- section purpose
- CTA destinations
- data dependencies

It does not repeat broader product rationale from `10-guided-dashboard-home.md` or rollout details from `12-home-implementation-plan.md`.

## Screen Intent

The Home screen should work like a daily search briefing.

The user should understand:

- current search state
- what needs attention
- what to do next

without scanning the full applications list.

## Navigation Context

- `Home` is the default signed-in landing page
- `Applications` is the management workspace
- `Board` is the kanban workflow
- `Offers` is the offer comparison workspace

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
|         |--------------------------------------------------------------------------- |
|         | Aging Applications                                  | Recommended Actions  |
|         |--------------------------------------------------------------------------- |
|         | Quick Import                                                                  |
+--------------------------------------------------------------------------------------+
```

## Mobile Wireframe

```text
+----------------------------------+
| Home                             |
| Greeting + summary               |
|----------------------------------|
| Stats                            |
|----------------------------------|
| Reminders                        |
|----------------------------------|
| Activity Graph                   |
|----------------------------------|
| Aging Applications               |
|----------------------------------|
| Recommended Actions              |
|----------------------------------|
| Quick Import                     |
|----------------------------------|
| Bottom Nav                       |
+----------------------------------+
```

## Section Spec

## 1. Greeting Header

Purpose:

- create a softer first moment
- summarize current search state

Content:

- time-of-day greeting
- user display name
- one short summary sentence

## 2. Top Stat Row

Recommended cards:

- `Applications Today`
- `Active Pipeline`
- `Interviews`
- `Offers`
- `Needs Follow-Up`

Behavior:

- each card is clickable
- each routes into a meaningful destination

## 3. Search Activity Graph

Recommended first version:

- last 7 days of application activity

Purpose:

- show momentum quickly

## 4. Upcoming / Reminders

First-release reminder types:

- stale interview
- aging applications
- no recent application activity

Later reminder types:

- interview today
- interview tomorrow

## 5. Aging Applications

Buckets:

- `1 week`
- `2 weeks`
- `3+ weeks`

Behavior:

- each bucket routes into the matching Applications review state

## 6. Recommended Actions

Required actions:

- `View Applications`
- `Save an Application`
- `Review Follow-Ups`
- `Check Offers`

## 7. Quick Import

Recommended first-release behavior:

- compact input on Home
- submit hands off into `Applications`
- full review/edit/save stays in Applications

## Home States

### First-time or near-empty

- emphasize greeting, actions, and quick import
- de-emphasize graph and aging sections

### Active user

- show full briefing layout

### Urgent reminders

- elevate reminder block visually
- summary line references urgency

## Data Mapping

| Module | Data Need | Can Launch Now |
|---|---|---|
| Greeting | user identity, simple summary | Yes |
| Stats | status counts, today count, stale count | Yes |
| Activity graph | created/applied timestamps | Yes |
| Reminders | stale logic, event dates later | Partial |
| Aging | application age buckets | Yes |
| Actions | route targets | Yes |
| Quick import | handoff state | Yes |

## Acceptance Criteria

- Home is understandable at a glance
- reminders are visible without opening Applications
- each major card/action leads somewhere useful
- Home stays lighter than Applications
