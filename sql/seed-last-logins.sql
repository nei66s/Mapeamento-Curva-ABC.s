-- Seed recent login events into audit_logs for admin dashboard "Últimos logins"
-- Inserts a "login" audit row per user for the most recent 20 users with staggered timestamps.

WITH recent_users AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn
  FROM users
  WHERE id IS NOT NULL
  ORDER BY id
  LIMIT 20
)
INSERT INTO audit_logs (user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at)
SELECT
  id,
  'auth'::text,
  id::text,
  'login'::text,
  NULL,
  ('{"success": true}')::jsonb,
  '127.0.0.1',
  'seed-script',
  now() - ((rn - 1) * interval '3 hours')
FROM recent_users;
