CREATE TABLE IF NOT EXISTS application_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Salary Components
  base_salary DECIMAL(12, 2),
  bonus_salary DECIMAL(12, 2),
  signing_bonus DECIMAL(12, 2),
  stock_equity TEXT,
  
  -- Non-monetary
  benefits TEXT,
  currency TEXT DEFAULT 'USD',
  pay_cadence TEXT DEFAULT 'annual',
  location_type TEXT,
  start_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_comp_application_id ON application_compensation (application_id);
CREATE INDEX IF NOT EXISTS idx_app_comp_currency ON application_compensation (currency);

CREATE OR REPLACE FUNCTION set_app_comp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_comp_updated_at ON application_compensation;
CREATE TRIGGER trg_app_comp_updated_at
BEFORE UPDATE ON application_compensation
FOR EACH ROW
EXECUTE FUNCTION set_app_comp_updated_at();
