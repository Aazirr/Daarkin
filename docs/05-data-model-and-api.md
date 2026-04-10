# Data Model and API (MVP Draft)

## Data Model

### Table: applications
- `id` (uuid, pk)
- `company_name` (text, not null)
- `position_title` (text, not null)
- `location` (text, nullable)
- `application_url` (text, nullable)
- `status` (text, not null, enum-like constraint)
- `applied_at` (date, nullable)
- `created_at` (timestamp, not null, default now)
- `updated_at` (timestamp, not null, default now)

Allowed `status` values:
- `applied`
- `interview`
- `offer`
- `rejected`

### Table: application_notes
- `id` (uuid, pk)
- `application_id` (uuid, fk -> applications.id, not null)
- `content` (text, not null)
- `created_at` (timestamp, not null, default now)
- `updated_at` (timestamp, not null, default now)

Index recommendations:
- `applications(status)`
- `applications(company_name)`
- `applications(position_title)`
- `application_notes(application_id)`

## REST API Draft

Base route: `/api`

### Applications
- `GET /applications`
  - Query params: `q`, `status`, `sortBy`, `sortOrder`, `page`, `pageSize`
- `GET /applications/:id`
- `POST /applications`
- `PATCH /applications/:id`
- `DELETE /applications/:id`

### Notes
- `GET /applications/:id/notes`
- `POST /applications/:id/notes`
- `DELETE /applications/:id/notes/:noteId`

## Example Application Payload

```json
{
  "companyName": "Acme Corp",
  "positionTitle": "Frontend Developer",
  "location": "Remote",
  "applicationUrl": "https://jobs.example.com/123",
  "status": "applied",
  "appliedAt": "2026-04-10"
}
```

## API Response Envelope (recommended)

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

## Validation Rules (initial)
- `companyName`: required, max 120 chars.
- `positionTitle`: required, max 120 chars.
- `status`: one of allowed values.
- `content` (note): required, max 3000 chars.
