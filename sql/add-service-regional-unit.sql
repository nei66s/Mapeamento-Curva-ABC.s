-- Add columns for regional and unit to services table
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS regional TEXT;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS unit TEXT;

-- Optional indexes
CREATE INDEX IF NOT EXISTS idx_services_regional ON services (regional);
CREATE INDEX IF NOT EXISTS idx_services_unit ON services (unit);
