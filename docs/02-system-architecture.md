# System Architecture

## Architecture Style
- Client-server web application with authentication.
- Frontend (SPA) communicates with backend REST API.
- Backend handles business rules, auth, and persistence in PostgreSQL.
- Session management via JWT tokens with localStorage caching.

## High-Level Diagram
1. User authenticates via login/register on Landing page.
2. Backend validates credentials, hashes passwords, issues JWT.
3. Frontend caches token and user info in localStorage.
4. Authenticated frontend sends JWT in requests to protected endpoints.
5. Express validates token and routes to appropriate handler.
6. Handler accesses database and returns normalized JSON responses.
7. Session persists across browser refreshes (cached in localStorage).

## Frontend Responsibilities
- Conditional routing (Landing for auth, Dashboard for app).
- Authentication UI (login/register forms).
- Session restoration from localStorage on app load.
- Form handling and client-side validation.
- State management for list/detail/filter views.
- API integration layer (authenticated requests).
- Responsive UI rendering.

## Backend Responsibilities
- User registration and login endpoints.
- Password hashing (bcrypt) and JWT signing.
- Expose REST endpoints for applications and notes.
- Validate request payloads.
- Enforce status transitions and data constraints.
- Handle errors and consistent response formats.
- Data access and SQL query orchestration.

## Database Responsibilities
- Durable storage for applications, notes, and users.
- Index support for fast search/filter.
- Referential integrity between entities.

## Proposed Logical Modules
- Web:
  - `pages`: Landing (auth), Dashboard (app).
  - `components`: Forms, cards, filters, status badge.
  - `services`: API client (applications, notes, auth).
  - `hooks`: useAuth for auth context access.
  - `context`: AuthContext for session management.
- API:
  - `routes`: HTTP endpoint definitions (auth, applications, notes).
  - `services`: Business logic (auth, applications, notes).
  - `repositories`: DB queries (users, applications, notes).
  - `middlewares`: Validation, error handling.
  - `schemas`: Input validation schemas (Zod).
- Database:
  - `users`: User credentials and profile.
  - `applications`: Job application tracking.
  - `application_notes`: Notes linked to applications.

## Authentication Flow
1. User submits email + password on Landing page
2. Frontend calls `auth-api.registerUser()` or `auth-api.loginUser()`
3. API validates input, hashes/verifies password, signs JWT
4. Backend returns `{ user, token }`
5. Frontend calls `authContext.login(token, user)`
6. AuthContext stores in React state + localStorage
7. useAuth hook updates, component re-renders
8. User redirected to Dashboard automatically

## Session Persistence  
- localStorage caches token + user JSON
- On app reload, AuthProvider hydrates from localStorage
- Shows loading state during restoration
- Automatic redirect to Dashboard if session exists
- User never needs to re-login after browser refresh
- Logout clears localStorage and redirects to Landing

## Non-Functional Targets
- Fast perceived UI response (< 200ms local interactions).
- API p95 under 300ms for simple CRUD in local/dev conditions.
- Input validation at API boundary with clear error messages.
- Session restoration within 500ms on app load.
- Secure password storage with bcrypt hashing.
- JWT token verification on every protected request.
