<#
Run basic DB maintenance tasks against the configured Postgres DB.

Usage:
  $env:PGPASSWORD='password'; $env:PGUSER='postgres'; $env:PGDATABASE='postgres'; .\scripts\db-maintenance.ps1

This script will:
- Create recommended indexes for audit table
- Run VACUUM (ANALYZE) on public schema
- Show current connection and settings recommendations
#>

param()

function Run-Sql($sql) {
  $env:PGPASSWORD = $env:PGPASSWORD
  psql -U $env:PGUSER -d $env:PGDATABASE -c $sql
}

Write-Host 'Ensuring audit indexes exist...'
Run-Sql "CREATE INDEX IF NOT EXISTS audit_admin_dropped_tables_table_name_idx ON audit.admin_dropped_tables (table_name);"
Run-Sql "CREATE INDEX IF NOT EXISTS audit_admin_dropped_tables_dropped_at_idx ON audit.admin_dropped_tables (dropped_at);"

Write-Host 'Running VACUUM ANALYZE on public schema (this may take time)...'
Run-Sql "VACUUM (VERBOSE, ANALYZE) public;"

Write-Host 'Recommended pool settings (see src/lib/db.ts). Review and tune on production:'
Write-Host "- max connections for pg.Pool: set PGPOOL_MAX if you add it; default depends on pg client."
Write-Host "- Enable DB_LOG_QUERIES=true for slow query identification during maintenance windows."

Write-Host 'Done.'
