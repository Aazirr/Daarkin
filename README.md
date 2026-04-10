# Job Application Tracker

A full-stack web app to help job seekers track applications through each hiring stage.

## Vision
Build a focused, fast, and clean tracker that makes job search management easier across desktop and mobile.

## Tech Stack
- Frontend: React, Tailwind CSS, Vite
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Tooling: Git

## Repo Layout
- `apps/web` - React + Vite frontend
- `apps/api` - Express API backend
- `packages/shared` - Shared types/validation (planned)
- `database` - SQL migrations and seed scripts
- `docs` - Product and architecture documentation

## Quick Start
1. Install dependencies:
	- `npm install`
2. Configure API environment:
	- Copy `apps/api/.env.example` to `apps/api/.env`
	- Set `DATABASE_URL` for your PostgreSQL instance
3. Run migrations:
	- `npm run migrate`
4. Start apps in separate terminals:
	- `npm run dev:api`
	- `npm run dev:web`

Default local URLs:
- Web: `http://localhost:5173`
- API: `http://localhost:4000`

## Vercel Deployment
- Deploy the repository root as a single Vercel project.
- Vercel will serve the React app from `apps/web/dist`.
- The Express API is exposed through the root `api/[...path].js` serverless function.
- Set `DATABASE_URL` in Vercel project environment variables before using database-backed endpoints.
- Keep API requests relative, for example `/api/meta/statuses`.

## Documentation Index
- `docs/01-product-scope.md`
- `docs/02-system-architecture.md`
- `docs/03-project-structure.md`
- `docs/04-feature-roadmap.md`
- `docs/05-data-model-and-api.md`

## MVP Goal
Allow users to create, update, search, and track job applications with notes and clear status transitions.

## Phase 0 Delivered
- Monorepo workspaces wired via npm workspaces
- Web app foundation with React + Vite + Tailwind
- API foundation with Express and shared response envelope
- Shared status enum contract (`applied`, `interview`, `offer`, `rejected`)
- PostgreSQL connection setup and SQL migration runner
