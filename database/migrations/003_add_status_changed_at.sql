ALTER TABLE applications
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

UPDATE applications
SET status_changed_at = COALESCE(status_changed_at, created_at)
WHERE status_changed_at IS NULL;

CREATE OR REPLACE FUNCTION set_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status_changed_at = COALESCE(NEW.status_changed_at, NOW());
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applications_status_changed_at ON applications;
CREATE TRIGGER trg_applications_status_changed_at
BEFORE INSERT OR UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION set_status_changed_at();
