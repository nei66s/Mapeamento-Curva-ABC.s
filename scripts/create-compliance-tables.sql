-- SQL to create minimal tables for the compliance feature
-- Run this against your Postgres database (psql or any client)

-- Checklist items table
CREATE TABLE IF NOT EXISTS compliance_checklist_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  classification TEXT NOT NULL DEFAULT 'C'
);

-- Visits table (denormalized). 'items' uses JSONB to store list of { itemId, status }
CREATE TABLE IF NOT EXISTS compliance_visits (
  id SERIAL PRIMARY KEY,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  items JSONB DEFAULT '[]'::jsonb
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_compliance_visits_store_date ON compliance_visits(store_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_compliance_visits_visit_date ON compliance_visits(visit_date);

-- Example insert (optional)
-- INSERT INTO compliance_checklist_items (name, classification) VALUES ('Verificar luz de emergência', 'A');
-- INSERT INTO compliance_visits (store_id, store_name, visit_date, items) VALUES ('LOJA-1', 'Loja A', '2025-11-10T09:00:00Z', '[{"itemId":"1","status":"pending"}]');
