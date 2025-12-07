-- Migration: create account_requests table
-- Apply this on the main database (psql or your migration runner)

CREATE TABLE IF NOT EXISTS account_requests (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes for admin lookups
CREATE INDEX IF NOT EXISTS idx_account_requests_email ON account_requests(email);
CREATE INDEX IF NOT EXISTS idx_account_requests_status ON account_requests(status);

-- Example insert (uncomment to seed a sample request)
-- INSERT INTO account_requests (id, name, email, message) VALUES ('ar-sample-1', 'Exemplo', 'exemplo@example.com', 'Solicitação de teste');
