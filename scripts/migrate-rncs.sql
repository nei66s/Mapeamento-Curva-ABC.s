-- Migration to add common columns to rncs table if missing
BEGIN;

ALTER TABLE rncs ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE rncs ADD COLUMN IF NOT EXISTS classification TEXT;
ALTER TABLE rncs ADD COLUMN IF NOT EXISTS incident_id TEXT;
ALTER TABLE rncs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

COMMIT;

-- Example inserts (optional)
-- INSERT INTO rncs (title, description, supplier_id, classification, incident_id, created_at, status) VALUES
-- ('Atraso na entrega', 'Peças não entregues dentro do prazo acordado', '1', 'Moderada', NULL, now(), 'Aberta');
