-- Migration: add permissions JSONB column to users and backfill from roles
BEGIN;

-- add column if it does not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB;

-- GIN index for fast JSONB contains queries
CREATE INDEX IF NOT EXISTS idx_users_permissions_gin ON users USING gin (permissions);

-- backfill per-user permissions based on user's role (role stored as id or name)
WITH perms AS (
  SELECT u.id,
         jsonb_agg(DISTINCT p.key) FILTER (WHERE p.key IS NOT NULL) AS perms
  FROM users u
  LEFT JOIN roles r ON r.id::text = u.role OR r.name = u.role
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
  LEFT JOIN permissions p ON p.id = rp.permission_id
  GROUP BY u.id
)
UPDATE users u
SET permissions = perms.perms
FROM perms
WHERE u.id = perms.id
  AND perms.perms IS NOT NULL;

COMMIT;

-- Note: run on staging first and backup production DB.
