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

## Future Data Model Additions (Post-MVP)

### Salary and Offer Comparison
- `applications`
  - `salary_base` (numeric, nullable)
  - `salary_bonus` (numeric, nullable)
  - `salary_equity` (numeric, nullable)
  - `salary_currency` (text, nullable)
  - `salary_period` (text, nullable, e.g., yearly/monthly)
  - `offer_benefits_summary` (text, nullable)
- Optional table: `offer_comparisons`
  - `id` (uuid, pk)
  - `user_id` (uuid, fk -> users.id)
  - `name` (text)
  - `weights_json` (jsonb)
  - `created_at`, `updated_at`

### Job URL Autofill
- `applications`
  - `source_url` (text, nullable)
  - `source_extracted_at` (timestamp, nullable)
  - `source_confidence_json` (jsonb, nullable)
- Optional table: `job_import_events`
  - `id` (uuid, pk)
  - `user_id` (uuid, fk -> users.id)
  - `url` (text)
  - `normalized_payload_json` (jsonb)
  - `created_at`

### Gmail/Outlook Integration
- `email_integrations`
  - `id` (uuid, pk)
  - `user_id` (uuid, fk -> users.id)
  - `provider` (text, values: gmail|outlook)
  - `encrypted_access_token` (text)
  - `encrypted_refresh_token` (text)
  - `token_expires_at` (timestamp)
  - `connected_at`, `updated_at`
- `email_events`
  - `id` (uuid, pk)
  - `user_id` (uuid, fk -> users.id)
  - `provider_message_id` (text)
  - `application_id` (uuid, fk -> applications.id, nullable)
  - `detected_type` (text, e.g., apply_confirmation|interview|offer|rejection)
  - `occurred_at` (timestamp)
  - `metadata_json` (jsonb)

## Future API Endpoints (Post-MVP)

### Offer Comparison
- `POST /applications/:id/offer`
- `PATCH /applications/:id/offer`
- `POST /offer-comparisons`
- `GET /offer-comparisons/:id`

### URL Autofill
- `POST /applications/import-from-url`
  - Input: `{ url }`
  - Output: normalized application draft + field confidence map

### Inbox Integrations
- `POST /integrations/gmail/connect`
- `POST /integrations/outlook/connect`
- `DELETE /integrations/:provider`
- `POST /integrations/:provider/sync`
- `GET /applications/:id/email-events`
