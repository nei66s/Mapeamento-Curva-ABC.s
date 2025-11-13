-- Faster listing of public tables not in the application whitelist
-- Uses catalog tables (pg_class / pg_namespace) which are usually faster than information_schema

WITH whitelist(name) AS (
  VALUES
    ('users'),('categories'),('items'),('stores'),('store_items'),('suppliers'),
    ('incidents'),('warranty_items'),('impact_factors'),('contingency_plans'),('lead_times'),('placeholder_images'),
    ('technicians'),('tools'),('technical_reports'),('vacation_requests'),('unsalvageable_items'),('settlement_letters'),
    ('rncs'),('indicators'),('indicadores_lancamentos'),('lancamentos_mensais'),
    ('compliance_checklist_items'),('compliance_visits'),('store_compliance_data')
)
SELECT n.nspname AS table_schema, c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN whitelist w ON w.name = c.relname
WHERE c.relkind = 'r' -- ordinary table
  AND n.nspname = 'public'
  AND n.nspname <> 'audit'
  AND w.name IS NULL
ORDER BY c.relname;
