CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_email TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail')),
  provider_message_id TEXT NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  detected_type TEXT NOT NULL CHECK (detected_type IN ('applied', 'interview', 'offer', 'rejected', 'unknown')),
  occurred_at TIMESTAMPTZ NOT NULL,
  subject TEXT,
  sender TEXT,
  snippet TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider, provider_message_id)
);

CREATE INDEX IF NOT EXISTS idx_email_integrations_user_provider
  ON email_integrations (user_id, provider);

CREATE INDEX IF NOT EXISTS idx_email_events_user_id
  ON email_events (user_id);

CREATE INDEX IF NOT EXISTS idx_email_events_application_id
  ON email_events (application_id);

CREATE OR REPLACE FUNCTION set_email_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_integrations_updated_at ON email_integrations;
CREATE TRIGGER trg_email_integrations_updated_at
BEFORE UPDATE ON email_integrations
FOR EACH ROW
EXECUTE FUNCTION set_email_integrations_updated_at();

CREATE OR REPLACE FUNCTION set_email_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_events_updated_at ON email_events;
CREATE TRIGGER trg_email_events_updated_at
BEFORE UPDATE ON email_events
FOR EACH ROW
EXECUTE FUNCTION set_email_events_updated_at();
