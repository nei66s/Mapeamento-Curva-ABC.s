-- Change audit_logs.user_id to text so it can accept integer or uuid keys
ALTER TABLE IF EXISTS audit_logs
  ALTER COLUMN user_id TYPE text USING user_id::text;
