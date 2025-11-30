-- Create audit_logs table if it does not exist (minimal schema used by admin)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  entity text,
  entity_id text,
  action text,
  before_data jsonb,
  after_data jsonb,
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index to speed lookups by user_id and created_at
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at ON audit_logs (user_id, created_at DESC);
