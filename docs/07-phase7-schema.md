# Phase 7: Offer Intelligence - Database Schema

## Overview
Phase 7 introduces offer comparison and scoring capabilities. This document outlines the database schema changes needed to support compensation tracking, comparison workflows, and configurable scoring models.

## Current Schema (through Phase 6)

**applications table:**
```
- id (UUID, PK)
- company_name (TEXT)
- position_title (TEXT)
- location (TEXT)
- application_url (TEXT)
- status (TEXT: 'applied', 'interview', 'offer', 'rejected')
- applied_at (DATE)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- user_id (UUID, FK → users.id) [added in Phase 3.5]
```

**application_notes table:**
```
- id (UUID, PK)
- application_id (UUID, FK → applications.id)
- note_text (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**users table:**
```
- id (UUID, PK)
- email (TEXT, UNIQUE)
- password_hash (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

---

## Phase 7 Schema Changes

### 1. Application Compensation Details (NEW TABLE)

**Purpose:** Store compensation data for each application, enabling structured comparison.

```sql
CREATE TABLE application_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Salary Components
  base_salary DECIMAL(12, 2),                    -- Annual base salary (USD or specified currency)
  bonus_salary DECIMAL(12, 2),                   -- Annual bonus amount or target
  signing_bonus DECIMAL(12, 2),                  -- One-time signing bonus
  stock_equity TEXT,                             -- Description: "50k shares", "0.25% equity", etc.
  
  -- Non-monetary
  benefits TEXT,                                 -- Description: "Health, 401k match (6%), FSA"
  currency TEXT DEFAULT 'USD',                   -- ISO 4217 (USD, EUR, GBP, etc)
  pay_cadence TEXT DEFAULT 'annual',             -- 'annual', 'monthly', 'bi-weekly', etc
  location_type TEXT,                            -- 'remote', 'hybrid', 'on-site'
  start_date DATE,                               -- Proposed start date
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_comp_application_id ON application_compensation (application_id);
CREATE INDEX idx_app_comp_currency ON application_compensation (currency);

-- Auto-update trigger
CREATE TRIGGER trg_app_comp_updated_at
BEFORE UPDATE ON application_compensation
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

**Rationale:**
- `UNIQUE` on `application_id`: One compensation record per application
- `DECIMAL(12,2)`: Precise currency handling (12 digits, 2 decimals = up to 9,999,999,999.99)
- `TEXT` for equity/benefits: Flexible for qualitative descriptions while also allowing structured data entry later
- `currency`: Enables multi-currency comparison (important for international roles)
- `pay_cadence`: Helps normalize interpretation (e.g., "100k annual" vs "4,800 bi-weekly")

---

### 2. User Scoring Weights (NEW TABLE)

**Purpose:** Store per-user configurable weights for offer scoring model.

```sql
CREATE TABLE user_scoring_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scoring weights (normalized to 0-1, should sum to ~1.0)
  weight_base_salary DECIMAL(3, 2) DEFAULT 0.35,
  weight_bonus DECIMAL(3, 2) DEFAULT 0.15,
  weight_equity DECIMAL(3, 2) DEFAULT 0.20,
  weight_benefits DECIMAL(3, 2) DEFAULT 0.10,
  weight_remote DECIMAL(3, 2) DEFAULT 0.10,
  weight_career_growth DECIMAL(3, 2) DEFAULT 0.10,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_weights_user_id ON user_scoring_weights (user_id);

-- Auto-update trigger
CREATE TRIGGER trg_user_weights_updated_at
BEFORE UPDATE ON user_scoring_weights
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

**Rationale:**
- `UNIQUE` on `user_id`: One scoring preference per user
- `DECIMAL(3, 2)`: Percentages as 0.00 to 1.00 (e.g., 0.35 = 35%)
- Defaults reflect typical job-seeker priorities: Salary > Equity > Benefits > Flexibility
- Weights are configurable per user, stored server-side for consistency
- Extensible: Easy to add new factors (work-life balance, relocation, etc)

---

## API Endpoints (Phase 7A - Implementation Order)

### Compensation CRUD
```
POST   /api/applications/:id/compensation       -- Create/upsert compensation
GET    /api/applications/:id/compensation       -- Get compensation for one app
GET    /api/applications?status=offer           -- List offers (filter by status)
PATCH  /api/applications/:id/compensation       -- Update compensation
DELETE /api/applications/:id/compensation       -- Clear compensation
```

### Scoring & Comparison
```
GET    /api/user/scoring-weights                 -- Get user's scoring weights
PATCH  /api/user/scoring-weights                 -- Update user's scoring weights
POST   /api/offers/compare                       -- Compare selected offers (returns scores)
GET    /api/offers/compare?ids=id1,id2,id3      -- Get comparison data for multiple offers
```

---

## Migration Files Order

1. **007_create_application_compensation.sql** - Add compensation table
2. **008_create_user_scoring_weights.sql** - Add scoring weights table
3. **009_add_user_id_to_user_scoring_weights.sql** (optional cleanup if needed)

---

## Data Integrity Notes

- **Foreign Keys:** ✓ All FK constraints with ON DELETE CASCADE
- **Indexing:** ✓ Indexes on frequent query paths (user_id, application_id)
- **Auto-timestamps:** ✓ created_at/updated_at triggers
- **Currency Normalization:** Scoring model will convert all salaries to USD equivalent using stored exchange rates (TBD in Phase 7D)
- **Nullable Fields:** Compensation fields are nullable to allow partial data entry (user can add fields incrementally)

---

## Scoring Model Formula (Phase 7D)

```javascript
const normalizedScore = (
  (baseSalary / max_salary) * weights.base * 100 +
  (bonus / max_salary) * weights.bonus * 100 +
  (equityValue / max_equity) * weights.equity * 100 +
  (benefitsScore / max_benefits) * weights.benefits * 100 +
  (remoteScore) * weights.remote * 100 +
  (growthScore) * weights.career_growth * 100
);
```

---

## Phase 7 Implementation Sequence

| Phase | Focus | Tables | API Endpoints |
|-------|-------|--------|---------------|
| **7A** | Infrastructure | `application_compensation` + `user_scoring_weights` | Compensation CRUD + scoring endpoints |
| **7B** | UI Data Entry | --- | --- (reuse 7A endpoints) |
| **7C** | Comparison View | --- | Comparison endpoint enhancement |
| **7D** | Scoring Model | --- | Scoring logic refinement |

---

## Testing Strategy (aligned with Phase 6)

- **Unit:** Scoring calculation logic (edge cases, empty fields, currency conversion)
- **Integration:** Compensation CRUD with auth + request tracing
- **E2E:** Import offer → Add compensation → Compare 2 offers → Verify top offer highlighted

---

## Future Considerations (Phase 8+)

- Exchange rate cache table for multi-currency conversion
- Offer history/versions tracking (e.g., salary negotiation trail)
- Negotiation templates & counteroffer tracking
- Integration with offer acceptance/decline workflow
