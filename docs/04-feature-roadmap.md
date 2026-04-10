# Feature Roadmap

## Phase 0: Foundation
- [x] Set up monorepo structure.
- [x] Initialize web app (React + Vite + Tailwind).
- [x] Initialize API app (Express).
- [x] Set up PostgreSQL connection and migration strategy.
- [x] Define shared status enum and base API response contract.

## Phase 1: Application CRUD
- [x] Create application form.
- [x] List applications in table/cards.
- [x] Edit and delete application.
- [x] API CRUD endpoints.
- [x] DB migration for `applications` table.

## Phase 2: Status Tracking
- [x] Status badge UI and status selector.
- [x] Enforce valid statuses in API.
- [x] Optional status-change timestamp field.

## Phase 3: Notes
- [x] Add notes on application detail screen.
- [x] Create/list/delete notes via API.
- [x] DB migration for `application_notes` table.

## Phase 3.5: Authentication & Session (COMPLETED)
- [x] Create users table migration.
- [x] Build auth service (register, login with bcrypt/JWT).
- [x] Create auth API endpoints (/register, /login).
- [x] Build auth-api TypeScript service.
- [x] Build AuthContext with session caching.
- [x] Implement localStorage-based session persistence.
- [x] Create App router for auth/dashboard routing.
- [x] Convert AuthContext and hooks to TypeScript.
- [x] Document authentication architecture.

## Phase 4: Search and Filters (COMPLETED)
- [x] Text search (company/role/location/notes).
- [x] Filter by status.
- [x] Sort by applied date and updated date.
- [x] Pagination support if dataset grows.

## Phase 5: Responsive and UX Polish (DELIVERED)
- [x] Subphase 5A: High-impact UX foundation
	- Always-visible URL import bar (inline extraction + manual fallback).
	- Optimistic UI updates with rollback on API failure.
	- Fast status actions (context menu / badge popover + micro-feedback).
- [x] Subphase 5B: Core interaction architecture
	- Split-pane detail drawer flow (list stays visible, URL deep-link aware).
	- Pipeline health segmented bar + key metrics + click-to-filter behavior.
	- Tokenized visual foundation (semantic colors, spacing, motion primitives).
- [x] Subphase 5C: Information design and navigation
	- Typography system (display + UI sans + mono roles).
	- Desktop layout constraints (collapsible sidebar, centered max content width).
	- List redesign (layered row info, stale-item attention signal, hover actions).
	- Search polish (hit highlighting, zero-result quick-add, keyboard focus shortcuts).
- [x] Subphase 5D: Experience polish across devices
	- Purposeful micro-interactions and state transitions.
	- Empty state system (first-run, filtered, and search contexts).
	- Keyboard navigation model (row traversal, drawer controls, shortcut discoverability).
	- Mobile UX adaptation (bottom nav, bottom-sheet detail, touch-friendly rows).
- [x] Subphase 5E: Quality, trust, and retention
	- Accessibility hardening (contrast, semantics, focus, touch targets, field-level errors).
	- Performance upgrades (virtualization, skeletons, cache-first render).
	- Notification/reminder preferences and trigger rules.
	- Onboarding improvements and CSV export for user trust/portability.

Reference: Detailed checklist in `docs/09-ui-ux-redesignplan.md`.

## Phase 6: Stabilization (IN PROGRESS)
- [~] Add unit/integration tests (API first).
- [~] Add basic frontend tests for key flows.
- [ ] Improve error logging and API observability.
- [x] Phase 6 kickoff: baseline API integration test harness added with Vitest + Supertest.
- [x] Added authenticated application route tests with mocked auth/service boundaries for list/create/update/delete flows.
- [x] Added frontend test harness (Vitest + Testing Library) and App auth-route baseline tests.

## Phase 7: Offer Intelligence
- Build salary and offer comparison workspace.
- Add compensation fields (base, bonus, equity, benefits, currency, pay cadence).
- Add offer scoring model (weighted categories configurable by user).
- Add side-by-side comparison UI for active offers.

## Phase 8: Job URL Autofill
- Add paste-url flow in create application form.
- Parse job posting pages and extract role/company/location/description snippets.
- Pre-fill form fields with confidence labels and allow user edits.
- Store source URL and extraction metadata for traceability.

## Phase 9: Inbox Integrations (Gmail/Outlook)
- OAuth connect flow for Gmail and Microsoft accounts.
- Sync application-related emails with background fetch.
- Detect status signals (interview invite, rejection, offer) from message patterns.
- Create suggested timeline events and status updates for user approval.
