-- Backfill: populate user_profile from existing users fields
-- Idempotent: safe to run multiple times
BEGIN;

-- Ensure user_profile exists (should also be created by migrate-unify-users.sql)
CREATE TABLE IF NOT EXISTS user_profile (
  user_id TEXT PRIMARY KEY,
  phone TEXT,
  bio TEXT,
  extra JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert or update profile rows from users table
-- Map: users.avatarUrl -> profile.extra->'avatar_url' (keep in JSON to avoid renaming columns now)
-- Map: users.department -> profile.extra->'department'
-- Map: users.supplier_id -> profile.extra->'supplier_id'

DO $$
DECLARE
  r RECORD;
  existing JSONB;
  merged JSONB;
BEGIN
  FOR r IN SELECT id::text AS user_id, avatarUrl, department, supplier_id FROM users LOOP
    existing := (SELECT extra FROM user_profile WHERE user_id = r.user_id LIMIT 1);
    IF existing IS NULL THEN
      merged := jsonb_build_object('avatar_url', r.avatarUrl, 'department', r.department, 'supplier_id', r.supplier_id);
      INSERT INTO user_profile (user_id, extra, updated_at) VALUES (r.user_id, merged, now()) ON CONFLICT (user_id) DO UPDATE SET extra = COALESCE(user_profile.extra, '{}'::jsonb) || EXCLUDED.extra, updated_at = now();
    ELSE
      merged := existing || jsonb_build_object('avatar_url', r.avatarUrl, 'department', r.department, 'supplier_id', r.supplier_id);
      UPDATE user_profile SET extra = merged, updated_at = now() WHERE user_id = r.user_id;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Notes:
-- - This keeps existing `user_profile.extra` JSONB and merges new keys, avoiding destructive column renames.
-- - If you later want to move `avatarUrl` to a dedicated `avatar_url` column, create a follow-up migration and update code accordingly.
