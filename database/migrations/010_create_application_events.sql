CREATE TABLE IF NOT EXISTS application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('interview', 'follow_up', 'offer_deadline', 'custom')),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_application_events_end_after_start
    CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS idx_application_events_application_id
  ON application_events (application_id);

CREATE INDEX IF NOT EXISTS idx_application_events_starts_at
  ON application_events (starts_at);

CREATE OR REPLACE FUNCTION set_application_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_events_updated_at ON application_events;
CREATE TRIGGER trg_application_events_updated_at
BEFORE UPDATE ON application_events
FOR EACH ROW
EXECUTE FUNCTION set_application_events_updated_at();
