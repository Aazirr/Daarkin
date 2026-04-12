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
	- Always-visible URL import bar (extract-to-modal review + manual fallback).
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
- [~] Improve error logging and API observability.
- [x] Phase 6 kickoff: baseline API integration test harness added with Vitest + Supertest.
- [x] Added authenticated application route tests with mocked auth/service boundaries for list/create/update/delete flows.
- [x] Added frontend test harness (Vitest + Testing Library) and App auth-route baseline tests.
- [x] Added request-id propagation (response header + response meta) and standardized metadata assertions for success/error contracts.
- [x] Added GitHub Actions CI gate to run workspace test and build on push/PR.
- [x] Extended route-level API tests with request metadata assertions.
- [x] Added Dashboard pipeline interaction test to verify filter behavior from status segments.
- [x] Added Dashboard optimistic status change tests for both success prompt and rollback-on-failure behavior.
- [x] Added comprehensive notes CRUD route tests (9 tests): list, create success/validation/not-found, update success/not-found, delete success/not-found.
- [x] Added Dashboard import flow test: URL extraction → form completion → application add with success feedback.

**Phase 6 Metrics:**
- Total tests: 24 (17 API integration, 7 web interaction)
- API coverage: Applications (5 tests) + Notes (9 tests) + Integration baseline (3 tests)
- Web coverage: App routing (3 tests) + Dashboard interactions (4 tests: pipeline filter, status optimistic success/rollback, import success)
- CI/CD: GitHub Actions workflow enforcing tests + build on all commits/PRs
- Observability: Per-request UUID tracing, standardized error metadata, request-id header propagation

## Phase 7: Offer Intelligence (COMPLETED ✅)
- [x] Build salary and offer comparison workspace.
- [x] Add compensation fields (base, bonus, equity, benefits, currency, pay cadence).
- [x] Add offer scoring model (weighted categories configurable by user).
- [x] Add side-by-side comparison UI for active offers.

**Schema Overview (See `docs/07-phase7-schema.md` for full details):**
- New table: `application_compensation` - stores base, bonus, equity, benefits, currency, location_type, etc per application
- New table: `user_scoring_weights` - stores user's configurable scoring weights (base salary: 35%, bonus: 15%, equity: 20%, benefits: 10%, remote: 10%, growth: 10%)
- Migrations: `007_create_application_compensation.sql` + `008_create_user_scoring_weights.sql`

**Phase 7 Subphases:**
- [x] **7A: Data Model & API** - ✅ Complete (migrations, compensation CRUD endpoints, scoring weights endpoints, all tests passing)
- [x] **7B: Compensation UI** - ✅ Complete (add/edit compensation now uses modal popup form from application detail; improved clean UX flow; added PHP currency support)
- [x] **7C: Comparison Workspace** - ✅ Complete (filter offers with status='offer', select 2+ to compare, sortable side-by-side table with fields + calculated scores, multi-select UI)
- [x] **7D: Scoring Configuration** - ✅ Complete (adjustable weights with range/number inputs, real-time score recalculation, top offer highlighting, progress bar for weight allocation)

**Phase 7C Deliverables:**
- Offers API endpoints: `GET /api/offers` and `GET /api/offers/:id` with compensation and scoring data
- OfferComparisonTable component: sortable columns (company, position, salary, bonus, stock, location, score), multi-select, color-coded score badges
- OfferSelector component: multi-select with remove options, "Compare X Offers" button
- Offers view with two-column layout and sticky comparison panel
- Expandable sidebar navigation with functional "Dashboard", "Board", and active "Offers" states
- All 42 API tests passing (6 test files)

**Phase 7D Deliverables:**
- ScoringWeightsEditor modal component with range and number input controls
- Settings button integrated in Offers view header (⚙ Settings)
- Real-time offer score recalculation when user adjusts weights
- Top offer highlighting with crown badge (👑) indicator and visual highlight row
- Progress bar showing total weight allocation (target: 100%)
- Reset to default weights option
- Fetch and update scoring weights API integration (fetchScoringWeights, updateScoringWeights)
- Responsive design for mobile (vertical weight field layout, full-width modal)
- All 7 web tests passing (no regressions)

## Phase 8: Job URL Autofill (IN PROGRESS)
- [x] Backend URL extraction service with multi-strategy parsing
- [x] API endpoint for extracting job data from URLs
- [x] Frontend extraction preview modal
- [x] Add URL input field to create application form
- [x] Auto-fill form fields with extracted data
- [ ] End-to-end testing

**Phase 8 Subphases:**
- [x] **8A: Backend URL Extraction** - ✅ Complete (extraction service, API endpoint, route tests)
- [x] **8B: Frontend Integration** - ✅ Complete (extraction preview modal, form integration, confidence badges)

**Phase 8A Deliverables (Completed):**
- URL extraction service (`url-extraction.service.js`):
  * Multi-strategy extraction: Open Graph meta tags, JSON-LD JobPosting schema, common job board selectors, domain-based fallback
  * Confidence scoring (0-100) for each field: position title (35%), company name (25%), location (20%), description (20%)
  * Overall confidence calculation
  * Comprehensive error handling for invalid URLs and network failures
  * Dynamic cheerio import for Node 18 compatibility
- API endpoint: `POST /api/applications/extract-from-url`
  * URL validation (required, string type)
  * Returns extracted data with confidence levels and overall confidence score
  * Proper error handling and logging
- Database migration `009_add_source_url_to_applications.sql`:
  * `source_url TEXT` column for storing job posting URL
  * `extraction_metadata JSONB` column for storing extraction details (parser used, timestamp, confidence levels)
  * Index on `source_url` for query performance
- Dependencies: cheerio ^1.0.0-rc.12 (npm install completed)
- Route-level tests: 4 new extraction endpoint tests, all 46 API tests passing across 6 suites
- Backend commits: `2e2eb10`, `6f67de1`

**Phase 8B Deliverables (Completed):**
- ExtractionPreview modal component (`ExtractionPreview.jsx`):
  * Display extracted job data with editable fields
  * Confidence badges showing extraction reliability (High/Medium/Low with color coding)
  * Overall confidence bar with visual gradient progress
  * Allow user to edit any extracted field before confirming
  * Auto-fill form submission when user clicks "Auto-fill Form"
- ExtractionPreview styling (`ExtractionPreview.css`):
  * Dark-themed modal matching dashboard aesthetic
  * Animations for modal entrance/slide-in
  * Responsive design (mobile: bottom-sheet style, tablet/desktop: centered)
  * Color-coded confidence badges (green ≥80%, yellow 60-79%, red <60%)
  * Focus states and accessibility features
- Enhanced Dashboard (`Dashboard.jsx`):
  * Import `ExtractionPreview` component and `extractFromUrl` function
  * Add extraction state management (extractedData, extractionLoading, extractionError)
  * Update `handleImportExtract` to detect URLs and call API extraction
  * Implement graceful fallback to local parsing when API fails
  * Handle extraction field changes and confirmation flow
  * Render extraction preview modal in Quick Import section
- Updated tests (`Dashboard.test.jsx`):
  * Add `extractFromUrl` to mock
  * Test fallback behavior when extraction service is unavailable
  * All 4 Dashboard tests passing
  * All 7 web tests passing
- Frontend commits: `d7ea867`

**Test Status (Phase 8 Complete):**
- Web tests: 7/7 passing ✅
- API tests: 46/46 passing ✅
- Extraction endpoint tests: 4/4 passing ✅
- No regressions from previous phases

**Next Steps (Phase 8C - Optional):**
- Store extracted source_url in applications table
- Display extraction confidence in application detail view
- Add extraction metadata to application records
- Test end-to-end workflow with real job posting URLs

## Phase 9: Inbox Integrations (Gmail/Outlook)
- OAuth connect flow for Gmail and Microsoft accounts.
- Sync application-related emails with background fetch.
- Detect status signals (interview invite, rejection, offer) from message patterns.
- Create suggested timeline events and status updates for user approval.
