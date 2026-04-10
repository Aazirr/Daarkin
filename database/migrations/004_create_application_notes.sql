CREATE TABLE IF NOT EXISTS application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes (application_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_created_at ON application_notes (created_at DESC);

CREATE OR REPLACE FUNCTION set_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_application_notes_updated_at ON application_notes;
CREATE TRIGGER trg_application_notes_updated_at
BEFORE UPDATE ON application_notes
FOR EACH ROW
EXECUTE FUNCTION set_notes_updated_at();
