-- sql/create-users-full-view.sql
-- Idempotent creation of a view that exposes a unified user shape
-- This view aggregates roles and includes profile.extra as `profile` JSONB.
-- Run after the unify users migration; safe to run repeatedly.

CREATE OR REPLACE VIEW public.users_full AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.created_at,
  -- optional columns
  CASE WHEN to_regclass('public.user_profile') IS NOT NULL THEN (
    (SELECT up.extra FROM user_profile up WHERE up.user_id = u.id LIMIT 1)
  ) ELSE NULL END AS profile,
  CASE WHEN to_regclass('public.user_roles') IS NOT NULL THEN (
    (SELECT COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id)
  ) ELSE ARRAY[]::text[] END AS roles,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN u.status ELSE NULL END AS status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'permissions') THEN u.permissions ELSE NULL END AS permissions
FROM users u;

COMMENT ON VIEW public.users_full IS 'Unified view of users with aggregated roles and profile.extra as profile (non-destructive).';
