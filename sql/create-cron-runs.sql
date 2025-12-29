-- Create table to record cron run attempts
-- Run: psql "$DATABASE_URL" -f sql/create-cron-runs.sql

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cron_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL DEFAULT 'cron',
  started_at timestamptz NOT NULL DEFAULT now(),
  ran_at timestamptz NULL,
  status text NOT NULL,
  payload jsonb NULL,
  error text NULL
);
