CREATE TABLE IF NOT EXISTS user_scoring_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scoring weights (normalized 0-1)
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

CREATE INDEX IF NOT EXISTS idx_user_weights_user_id ON user_scoring_weights (user_id);

CREATE OR REPLACE FUNCTION set_user_weights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_weights_updated_at ON user_scoring_weights;
CREATE TRIGGER trg_user_weights_updated_at
BEFORE UPDATE ON user_scoring_weights
FOR EACH ROW
EXECUTE FUNCTION set_user_weights_updated_at();
