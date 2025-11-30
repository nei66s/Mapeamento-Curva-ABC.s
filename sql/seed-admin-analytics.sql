-- Create metrics_cache table if missing and insert timeseries for pageviews
CREATE TABLE IF NOT EXISTS metrics_cache (
  id serial primary key,
  metric_key text not null,
  metric_value jsonb,
  updated_at timestamptz default now()
);

-- ensure unique metric key for upserts
CREATE UNIQUE INDEX IF NOT EXISTS metrics_key_unique ON metrics_cache(metric_key);

-- Ensure a timestamp column exists for timeseries rows
ALTER TABLE metrics_cache ADD COLUMN IF NOT EXISTS "timestamp" timestamptz;

-- Add status column to users if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE users ADD COLUMN status text DEFAULT 'active';
  END IF;
END$$;

-- Insert 30 days of pageviews into metrics_cache for key 'pageviews' as a single JSON blob
WITH points AS (
  SELECT jsonb_agg(jsonb_build_object('timestamp', (date_trunc('day', now()) - (i || ' days')::interval), 'value', (50 + (random()*200))::int) ORDER BY (date_trunc('day', now()) - (i || ' days')::interval)) AS series
  FROM generate_series(0,29) as s(i)
)
INSERT INTO metrics_cache(metric_key, metric_value, "timestamp")
SELECT 'pageviews', series::jsonb, now() FROM points
ON CONFLICT (metric_key) DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = now(), "timestamp" = EXCLUDED."timestamp";

-- Insert aggregated user status counts into metrics_cache as JSON
WITH counts AS (
  SELECT jsonb_build_object(
    'active', COALESCE(sum(CASE WHEN status = 'active' THEN 1 ELSE 0 END),0),
    'blocked', COALESCE(sum(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END),0),
    'inactive', COALESCE(sum(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END),0),
    'total', count(*)
  ) AS value
  FROM users
)
INSERT INTO metrics_cache(metric_key, metric_value, "timestamp")
SELECT 'users.status_counts', value::jsonb, now() FROM counts
ON CONFLICT (metric_key) DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = now(), "timestamp" = EXCLUDED."timestamp";

-- Mark some demo users as blocked for admin-users widget demonstration
UPDATE users SET status = 'blocked' WHERE email IN ('demo.b@demo.local');
