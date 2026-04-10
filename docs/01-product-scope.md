# Product Scope

## Problem Statement
Job seekers often apply to many roles and lose track of status, history, and key notes for each company. Existing tools can be too generic or overcomplicated.

## Product Goal
Provide a simple, focused system that tracks the lifecycle of every job application and centralizes notes, progress, and search.

## Primary User
- Individual job seeker managing personal applications.

## Core Use Cases
- Add a new job application quickly.
- Update application status as the hiring process progresses.
- Add and read notes per application.
- Search and filter applications by company, role, and status.
- Review pipeline health at a glance.

## MVP Feature Set
1. Application management (create, read, update, delete).
2. Status tracking: Applied, Interview, Offer, Rejected.
3. Notes per application.
4. Search by text (company, role, location, notes).
5. Filter by status and date.
6. Responsive web UI.
7. User authentication (register, login, logout).
8. Per-user data isolation (users only see their own applications).

## Out of Scope for MVP
- Multi-user collaboration/sharing (each user has isolated data).
- Resume/cover letter storage.
- Email integration.
- Browser extension autofill.
- Analytics dashboards beyond basic counts.
- Social features (no commenting, teams, etc.).

## Success Criteria (MVP)
- User can register or login in under 20 seconds.
- User can create and update an application in under 30 seconds.
- User can find any application by keyword or status filter in under 5 seconds.
- UI works across mobile and desktop with no critical layout breaks.
- Each user's data is completely isolated (cannot see other users' applications).

## Authentication Approach
- Email + password registration.
- JWT-based session tokens stored in localStorage.
- Tokens sent in Authorization header for all API requests.
- Server validates tokens and enforces user-scoped queries.
- Landing page doubles as login/register portal.
- App redirects unauthenticated users to landing page.
