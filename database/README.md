# Database

## Migration Strategy
- SQL files live in `database/migrations`.
- Files are executed in lexicographical order.
- Applied migrations are tracked in `schema_migrations`.
- Run migrations with `npm run migrate` at repository root.

## Naming Convention
Use numeric prefixes for ordering:
- `001_enable_pgcrypto.sql`
- `002_create_applications.sql`
- `003_create_application_notes.sql`

## Local Setup
1. Start PostgreSQL locally.
2. Copy `apps/api/.env.example` to `apps/api/.env` and set `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run migrate`.
