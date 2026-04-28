CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_status TEXT CHECK (previous_status IN ('applied', 'interview', 'offer', 'rejected')),
  next_status TEXT NOT NULL CHECK (next_status IN ('applied', 'interview', 'offer', 'rejected')),
  source TEXT NOT NULL CHECK (source IN ('manual', 'email_auto')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_user_created
  ON application_status_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_status_history_application_created
  ON application_status_history (application_id, created_at DESC);
