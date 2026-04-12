-- Migration 009: Add source URL and extraction metadata for Phase 8
-- Tracks where applications came from (job posting URL) and extracted data confidence

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_applications_source_url ON applications (source_url);
