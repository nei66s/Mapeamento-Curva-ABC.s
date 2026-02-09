-- Seed: normalize `services.category` to allowed values and add constraint
-- Run this in Supabase SQL editor or psql connected to your DB.

BEGIN;

-- 1) Normalize existing values: keep allowed ones, set others to NULL so constraint can be applied safely
UPDATE services
SET category = NULL
WHERE category IS NOT NULL
  AND category NOT IN ('Manutenção', 'Refrigeração');

-- 2) (Optional) If you prefer a default instead of NULL, uncomment the following line:
-- UPDATE services SET category = 'Manutenção' WHERE category IS NULL;

-- 3) Ensure a clean constraint: drop if exists then add the check constraint
ALTER TABLE services
  DROP CONSTRAINT IF EXISTS chk_services_category_allowed;

ALTER TABLE services
  ADD CONSTRAINT chk_services_category_allowed
  CHECK (category IN ('Manutenção', 'Refrigeração') OR category IS NULL);

COMMIT;

-- Quick verification queries you can run after the seed:
-- SELECT category, count(*) FROM services GROUP BY category ORDER BY count DESC;
-- SELECT id, title, category FROM services WHERE category IS NULL LIMIT 50;