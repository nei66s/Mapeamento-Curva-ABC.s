SELECT table_catalog, table_schema, table_name
FROM information_schema.tables
WHERE table_name ILIKE 'audit%';
