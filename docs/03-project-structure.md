# Project Structure

## Monorepo Layout

```text
Daarkin/
  apps/
    web/                 # React + Vite + Tailwind
      src/
        app/
        pages/
        components/
        features/
        services/
        hooks/
        styles/
    api/                 # Express API
      src/
        config/
        routes/
        controllers/
        services/
        repositories/
        middlewares/
        schemas/
        utils/
  packages/
    shared/              # Shared TS types/constants (optional in MVP)
      src/
  database/
    migrations/
    seeds/
  docs/
  README.md
```

## Conventions
- Keep frontend feature code grouped under `features/<feature-name>`.
- Keep API route/controller/service/repository layers separated.
- Use explicit DTOs at API boundary.
- Keep SQL in repository layer, not in controllers.

## Naming
- Files: kebab-case (`application-list.tsx`).
- React components: PascalCase (`ApplicationList.tsx`).
- API endpoints: plural nouns (`/api/applications`).

## Branching Strategy
- `main`: production-ready history.
- `feature/<name>`: one feature at a time.
- Small PRs aligned with roadmap phases.
