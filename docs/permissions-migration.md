# Permissions migration

This document explains how to add a per-user `permissions` JSONB column on the `users` table and backfill permissions from the existing `roles` / `role_permissions` / `permissions` tables.

Files added:
- `sql/migrate-add-users-permissions.sql` — SQL migration that adds the column, creates a GIN index, and backfills per-user permissions.
- `scripts/backfill-user-permissions.js` — Node script that runs the migration and backfill in a transaction.

Run (PowerShell example):

```powershell
# set DB environment variables first (example)
$env:PGHOST = 'localhost'
$env:PGUSER = 'postgres'
$env:PGPASSWORD = 'secret'
$env:PGDATABASE = 'mydb'
$env:PGPORT = '5432'

# run backfill script (uses the env vars)
node .\scripts\backfill-user-permissions.js
```

Or run the SQL directly with `psql`:

```powershell
psql "host=$env:PGHOST user=$env:PGUSER dbname=$env:PGDATABASE password=$env:PGPASSWORD port=$env:PGPORT" -f sql/migrate-add-users-permissions.sql
```

Notes:
- Run these in a staging environment first and ensure you have DB backups before applying to production.
- The backfill maps permissions by joining `users.role` (which may contain a role id or role name) to `roles`, then to `role_permissions` → `permissions`, and writes a JSON array of permission keys to `users.permissions`.
- After migrating, the application will prefer per-user `permissions` when building sessions; if you want to continue using role-based permissions instead, skip the backfill until you're ready.
