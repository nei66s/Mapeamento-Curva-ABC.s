-- Migration: create escopos table
-- Date: 2026-02-10

BEGIN;

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS escopos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  norms jsonb,
  requester text,
  store_id uuid,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS escopos_created_by_idx ON escopos(created_by);
CREATE INDEX IF NOT EXISTS escopos_store_id_idx ON escopos(store_id);

COMMIT;
