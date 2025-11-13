BEGIN;

-- Ensure the users table has the expected columns used by the seed and app
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatarUrl TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- Ensure unsalvageable_items exists (matches app expectations)
CREATE TABLE IF NOT EXISTS unsalvageable_items (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  requester_id TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  disposal_date TIMESTAMPTZ
);

COMMIT;
