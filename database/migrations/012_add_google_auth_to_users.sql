ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS google_email TEXT,
  ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);
