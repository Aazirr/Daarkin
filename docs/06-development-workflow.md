# Development Workflow

## Feature-by-Feature Loop
1. Select next feature from roadmap.
2. Define acceptance criteria.
3. Design API/data changes.
4. Implement backend.
5. Implement frontend.
6. Add/adjust tests.
7. Manual QA pass (desktop + mobile).
8. Update docs/changelog.

## Definition of Done (per feature)
- Acceptance criteria are met.
- No critical runtime errors in web or API.
- API endpoint contract documented.
- Basic tests pass for modified areas.
- UI responsive behavior verified.
- PR notes include screenshots for UI changes.

## Branch and Commit Guidance
- Create branch: `feature/<phase>-<feature-name>`.
- Keep commits focused and descriptive.
- Open PR with:
  - scope summary
  - decisions/tradeoffs
  - test evidence

## Risk Controls
- Keep DB migrations backward-safe during development.
- Do not mix large refactors with feature delivery.
- Validate status enum consistency across web, API, and DB.

## Supabase Migration Runbook
1. Confirm Vercel `DATABASE_URL` and local migration `DATABASE_URL` target the same Supabase database.
2. Use the Supabase pooler URI with TLS: `?sslmode=require`.
3. Run migrations from repository root:
  - PowerShell: `$env:DATABASE_URL="<supabase-uri>"; npm run migrate`
4. Verify table updates in Supabase SQL Editor before deploying API changes.
5. If migration fails, fix SQL and rerun. Applied files are tracked in `schema_migrations`.
