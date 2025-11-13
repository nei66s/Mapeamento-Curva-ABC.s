-- DANGER: Drops all public tables not in the whitelist below.
-- Review carefully before running in production.

BEGIN;

-- Whitelist of tables used by the application
WITH whitelist(name) AS (
  VALUES
    -- Core domain
    ('users'),
    ('categories'),
    ('items'),
    ('stores'),
    ('store_items'),
    ('suppliers'),
    ('incidents'),
    ('warranty_items'),
    ('impact_factors'),
    ('contingency_plans'),
    ('lead_times'),
    ('placeholder_images'),
    ('technicians'),
    ('tools'),
    ('technical_reports'),
    ('vacation_requests'),
    ('unsalvageable_items'),
    ('settlement_letters'),
    ('rncs'),
    -- Indicators & financial sync
    ('indicators'),
    ('indicadores_lancamentos'),
    ('lancamentos_mensais'),
    -- Compliance
    ('compliance_checklist_items'),
    ('compliance_visits'),
    ('store_compliance_data')
)
SELECT format('DROP TABLE IF EXISTS %I.%I CASCADE;', t.table_schema, t.table_name) AS drop_sql
INTO TEMP TABLE _drop_list
FROM information_schema.tables t
LEFT JOIN whitelist w ON w.name = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_schema <> 'audit'
  AND w.name IS NULL;

-- Preview what will be dropped (uncomment to preview only)
-- SELECT * FROM _drop_list;

-- Execute drops
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT drop_sql FROM _drop_list LOOP
    RAISE NOTICE 'Executing: %', r.drop_sql;
    EXECUTE r.drop_sql;
  END LOOP;
END$$;

COMMIT;

