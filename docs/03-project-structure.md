# Project Structure

## Monorepo Layout

```text
Daarkin/
  apps/
    web/                 # React + Vite + Tailwind SPA
      src/
        App.tsx          # Main router (auth/dashboard conditional rendering)
        main.jsx         # Entry point with AuthProvider wrapper
        Landing.jsx      # Login/register page
        Dashboard.jsx    # Job application tracker UI
        context/
          AuthContext.tsx        # Auth state + session persistence
        hooks/
          useAuth.ts             # Auth context access hook
        services/
          auth-api.ts            # TypeScript client for login/register
          applications-api.js    # Job applications API client
          notes-api.js           # Notes API client
        styles/
        components/
        pages/
    api/                 # Express backend
      src/
        app.js           # Express app configuration
        server.js        # Server startup
        config/
          jwt.js         # JWT configuration (secret, options)
        routes/
          auth.routes.js         # POST /register, /login
          applications.routes.js # CRUD for applications
          notes.routes.js        # CRUD for notes
          meta.routes.js         # API metadata endpoints
        services/
          auth.service.js        # Registration, login, JWT generation
          applications.service.js
          notes.service.js
        repositories/
          users.repository.js    # User DB queries
          applications.repository.js
          notes.repository.js
        schemas/
          auth.schema.js         # Zod validation for auth payloads
          application.schema.js
          ...
        middlewares/
        utils/
  packages/
    shared/              # Shared TS types/constants
      src/
        index.js         # APPLICATION_STATUSES enum, logger
  database/
    migrations/          # DB schema migrations
    seeds/              # Seed data for development
  docs/
    01-product-scope.md
    02-system-architecture.md
    03-project-structure.md
    04-feature-roadmap.md
    05-data-model-and-api.md
    06-development-workflow.md
    07-design-system.md
    08-authentication.md           # Auth architecture & flows (NEW)
  README.md
```

## Conventions
- Keep frontend feature code grouped under `features/<feature-name>`.
- Keep API route/controller/service/repository layers separated.
- Use explicit DTOs at API boundary.
- Keep SQL in repository layer, not in controllers.
- Auth state managed globally via AuthContext (not scattered throughout components).

## Naming
- Files: kebab-case (`authentication.md`, `auth-api.ts`).
- React components: PascalCase (`Landing.jsx`, `Dashboard.jsx`).
- API endpoints: plural nouns (`/api/applications`, `/api/register`).
- TypeScript files: `.ts` (services, utils), `.tsx` (React components).
- JavaScript files: `.js` (when TypeScript not yet adopted).

## Key Files for Authentication

### Frontend
- `App.tsx`: Routes to Landing or Dashboard based on `useAuth()` state
- `main.jsx`: Wraps entire app with `<AuthProvider>`
- `context/AuthContext.tsx`: Manages user, token, loading state + localStorage sync
- `hooks/useAuth.ts`: Provides typed access to AuthContext
- `services/auth-api.ts`: Handles login/register API calls
- `Landing.jsx`: Auth UI (login/register forms)

### Backend
- `routes/auth.routes.js`: POST /register, /login endpoints
- `services/auth.service.js`: Business logic (validation, hashing, JWT)
- `repositories/users.repository.js`: User DB operations
- `schemas/auth.schema.js`: Input validation with Zod
- `config/jwt.js`: JWT configuration and constants

### Database
- `users` table: id, email, passwordHash, createdAt, updatedAt

## Branching Strategy
- `main`: production-ready history.
- `feature/<name>`: one feature at a time.
- Small PRs aligned with roadmap phases.
