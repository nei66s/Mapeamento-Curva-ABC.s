-- Migration: unify users model (non-destructive additions)
-- Adds optional columns to `users`, creates `auth_providers` and `user_profile` tables,
-- and ensures `user_roles` backfill is present. Safe to run multiple times.
BEGIN;

-- 1) Add non-destructive columns to `users`
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 2) Create auth_providers to support SSO and external accounts
CREATE TABLE IF NOT EXISTS auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_auth_providers_user_id ON auth_providers(user_id);

-- 3) Optional user_profile table for profile fields that may be moved out of `users`
CREATE TABLE IF NOT EXISTS user_profile (
  user_id TEXT PRIMARY KEY,
  phone TEXT,
  bio TEXT,
  extra JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Ensure user_roles exists and backfill from users.role (idempotent)
-- Note: repo already contains a script that maps textual `users.role` to `roles` and
-- inserts into `user_roles`. This INSERT is safe to re-run.
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  role_id TEXT,
  UNIQUE (user_id, role_id)
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role')
  THEN
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id::text, r.id::text
    FROM users u
    JOIN roles r ON LOWER(u.role) = LOWER(r.name)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- 5) Indexes to speed joins and lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_id_text ON users((id::text));

COMMIT;

-- Notes:
-- - This migration intentionally avoids changing primary key types or destructive operations.
-- - Before running in production: create a DB backup (pg_dump) and run in a maintenance window.
-- - Rollback is manual: DROP columns/tables added above if necessary — see README for guidance.
