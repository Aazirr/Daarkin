# Feature Roadmap

## Phase 0: Foundation
- Set up monorepo structure.
- Initialize web app (React + Vite + Tailwind).
- Initialize API app (Express).
- Set up PostgreSQL connection and migration strategy.
- Define shared status enum and base API response contract.

## Phase 1: Application CRUD
- Create application form.
- List applications in table/cards.
- Edit and delete application.
- API CRUD endpoints.
- DB migration for `applications` table.

## Phase 2: Status Tracking
- Status badge UI and status selector.
- Enforce valid statuses in API.
- Optional status-change timestamp field.

## Phase 3: Notes
- Add notes on application detail screen.
- Create/list/delete notes via API.
- DB migration for `application_notes` table.

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
