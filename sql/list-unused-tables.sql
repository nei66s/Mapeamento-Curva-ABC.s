-- Lists all public tables not in the application whitelist (safe to run)

WITH whitelist(name) AS (
  VALUES
    ('users'),('categories'),('items'),('stores'),('store_items'),('suppliers'),
    ('incidents'),('warranty_items'),('impact_factors'),('contingency_plans'),('lead_times'),('placeholder_images'),
    ('technicians'),('tools'),('technical_reports'),('vacation_requests'),('unsalvageable_items'),('settlement_letters'),
    ('rncs'),('indicators'),('indicadores_lancamentos'),('lancamentos_mensais'),
    ('compliance_checklist_items'),('compliance_visits'),('store_compliance_data')
)
SELECT t.table_schema, t.table_name
FROM information_schema.tables t
LEFT JOIN whitelist w ON w.name = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND w.name IS NULL
ORDER BY t.table_name;
