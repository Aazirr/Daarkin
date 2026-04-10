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

## Phase 4: Search and Filters
- Text search (company/role/location/notes).
- Filter by status.
- Sort by applied date and updated date.
- Pagination support if dataset grows.

## Phase 5: Responsive and UX Polish
- Mobile-friendly cards/list behavior.
- Form usability and validation messages.
- Empty/loading/error states.

## Phase 6: Stabilization
- Add unit/integration tests (API first).
- Add basic frontend tests for key flows.
- Improve error logging and API observability.

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
