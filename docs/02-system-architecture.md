# System Architecture

## Architecture Style
- Client-server web application.
- Frontend (SPA) communicates with backend REST API.
- Backend handles business rules and persistence in PostgreSQL.

## High-Level Diagram
1. React web client sends HTTP requests to Express API.
2. Express validates input and applies application rules.
3. Express reads/writes PostgreSQL tables.
4. API returns normalized JSON responses.

## Frontend Responsibilities
- Routing and page composition.
- Form handling and client-side validation.
- State management for list/detail/filter views.
- API integration layer.
- Responsive UI rendering.

## Backend Responsibilities
- Expose REST endpoints for applications and notes.
- Validate request payloads.
- Enforce status transitions and data constraints.
- Handle errors and consistent response formats.
- Data access and SQL query orchestration.

## Database Responsibilities
- Durable storage for applications and notes.
- Index support for fast search/filter.
- Referential integrity between entities.

## Proposed Logical Modules
- Web:
  - `pages`: Dashboard, Applications list, Application detail/edit.
  - `components`: Forms, table/cards, filters, status badge.
  - `services`: API client.
- API:
  - `routes`: HTTP endpoint definitions.
  - `controllers`: Request/response handlers.
  - `services`: Business logic.
  - `repositories`: DB queries.
  - `middlewares`: Validation, error handling.
- Shared:
  - `types`: DTOs and status enums.
  - `validators`: Shared schema contracts (optional in MVP).

## Non-Functional Targets
- Fast perceived UI response (< 200ms local interactions).
- API p95 under 300ms for simple CRUD in local/dev conditions.
- Input validation at API boundary.
- Basic security hygiene (helmet/cors/rate-limiting later phases).
