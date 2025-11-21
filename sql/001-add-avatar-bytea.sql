-- Migration: add avatar binary storage to users
-- Run this against your Postgres database (e.g. psql -f sql/001-add-avatar-bytea.sql)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_data bytea;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_mime text;

-- Optional: set existing avatar_url values to remain as-is. The application will prefer DB binary when available.

-- Example to verify:
-- SELECT id, avatar_url, avatar_mime IS NOT NULL AS has_mime, avatar_data IS NOT NULL AS has_data FROM users LIMIT 10;
