-- Helper: efficient insert into audit.admin_dropped_tables and index creation

CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.admin_dropped_tables (
  id bigserial primary key,
  table_schema text not null,
  table_name text not null,
  dropped_by text,
  dropped_at timestamptz default now(),
  sql text
);

-- Create indexes to speed up lookups by table_name and dropped_at
CREATE INDEX IF NOT EXISTS audit_admin_dropped_tables_table_name_idx ON audit.admin_dropped_tables (table_name);
CREATE INDEX IF NOT EXISTS audit_admin_dropped_tables_dropped_at_idx ON audit.admin_dropped_tables (dropped_at);

-- Function to append an audit row (safer and slightly faster than ad-hoc INSERTs)
CREATE OR REPLACE FUNCTION audit.log_dropped_table(p_schema text, p_table text, p_who text, p_sql text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO audit.admin_dropped_tables (table_schema, table_name, dropped_by, sql)
  VALUES (p_schema, p_table, p_who, p_sql);
END; $$;
