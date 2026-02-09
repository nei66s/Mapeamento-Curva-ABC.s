-- Add area_type, area_value and category to services; create service_stores mapping table
BEGIN;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS area_type TEXT,
  ADD COLUMN IF NOT EXISTS area_value TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE TABLE IF NOT EXISTS service_stores (
  id BIGSERIAL PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_area_type ON services(area_type);
CREATE INDEX IF NOT EXISTS idx_services_area_value ON services(area_value);
CREATE INDEX IF NOT EXISTS idx_service_stores_service_id ON service_stores(service_id);

COMMIT;
