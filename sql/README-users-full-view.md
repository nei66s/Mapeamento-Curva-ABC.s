 # `users_full` view — Deploy & Rollback

 Purpose
 - `users_full` is a non-destructive view that exposes a unified user shape for the app: it aggregates roles into an array and surfaces `user_profile.extra` as `profile` (JSONB). The view is safe to create repeatedly (`CREATE OR REPLACE VIEW`).

 When to deploy
 - Add this view when migrating to the unified users model. The view itself does not change data; it only provides a convenient shape for queries and adapters.

 Files
 - `sql/create-users-full-view.sql` — idempotent `CREATE OR REPLACE VIEW` statement and comment.

 Deploy steps (manual)
 1. Review the SQL in `sql/create-users-full-view.sql` and ensure it matches your target schema (particularly table and column names: `users`, `user_roles`, `roles`, `user_profile`).
 2. Run the SQL against your staging database:

    PowerShell (Windows):
    ```powershell
    psql "host=$env:PGHOST port=$env:PGPORT user=$env:PGUSER dbname=$env:PGDATABASE password=$env:PGPASSWORD" -f sql/create-users-full-view.sql
    ```

    Or using `psql` env-vars convention:
    ```powershell
    $env:PGHOST='localhost'; $env:PGUSER='mapeamento_user'; $env:PGPASSWORD='...'; $env:PGDATABASE='mapeamento'; psql -f sql/create-users-full-view.sql
    ```

 3. Verify view exists and returns expected columns:
    ```sql
    select column_name from information_schema.columns where table_name = 'users_full';
    select id, roles, profile from public.users_full limit 5;
    ```

 Rollback (manual)
 - Because it is a view, rollback is simply `DROP VIEW` if you want to remove the unified view while keeping the underlying schema intact.

 Example rollback:
 ```sql
 drop view if exists public.users_full;
 ```

 Notes & cautions
 - The view references optional objects (e.g., `user_profile`) with guards such as `to_regclass` and `information_schema` checks; however, if you change table/column names or remove those guards, double-check the SQL before applying.
 - The view is intended to be safe and non-destructive. Still, running SQL in production should follow your normal deployment/migration process (review, backup, run in staging, monitor).

 Running integration test locally
 - The repo includes `tests/integration/users-full-view.test.ts` which will attempt to:
   - create minimal tables if they don't exist,
   - seed a test user + role + profile,
   - apply `sql/create-users-full-view.sql`,
   - assert that `users_full` returns the expected shape.
 - The test requires DB credentials. You can either set a full set of Postgres env vars, or use the development fallback shown in the project's README. Example (PowerShell):

 ```powershell
 # Option A: use explicit environment variables
 $env:PGHOST='localhost'; $env:PGUSER='mapeamento_user'; $env:PGPASSWORD='yourpass'; $env:PGDATABASE='mapeamento'; npx vitest tests/integration/users-full-view.test.ts --run

 # Option B: allow the local fallback password (development only)
 $env:DEV_ALLOW_DEFAULT_PG_PASSWORD='true'; npx vitest tests/integration/users-full-view.test.ts --run
 ```

 If your local Postgres is managed by a helper script in this repo, run that first (for example `scripts/dev-setup.ps1`) to create the DB user and database with suitable defaults.

 CI considerations
 - For CI, provide a test Postgres service with credentials set in the pipeline and do NOT rely on `DEV_ALLOW_DEFAULT_PG_PASSWORD`.
 - Prefer running the integration test in a dedicated job that provisions a disposable database and runs the migration SQL and test, then destroys the DB.

 What I recommend next
 - Run the integration test against a staging/test Postgres instance (not production). If you want, I can scaffold a `scripts/test-db-setup.ps1` to spin up the required DB objects locally.

 ---
 Last updated: 2025-12-04
# users_full VIEW

This file documents the `users_full` VIEW created by `sql/create-users-full-view.sql`.

Purpose
- Provide a single, stable shape for UI and reporting consumers that need a "single table" view of users.
- Aggregate roles into an array and include `user_profile.extra` as `profile` JSONB.
- Allow clients to continue using a unified shape while preserving a normalized schema in the DB.

How to create
- Run the idempotent SQL file:

```
psql -h <host> -p <port> -U <user> -d <db> -f sql/create-users-full-view.sql
```

Development note: the SQL file is safe to run multiple times (uses `CREATE OR REPLACE VIEW`).

How the adapter uses the view
- `src/server/adapters/users-adapter.ts` now prefers `users_full` when it exists. If the view is present, the adapter queries `users_full` and returns a normalized shape (fields: `id, name, email, role, created_at, status, permissions, roles, profile, lastAccessAt`).
- If the view does not exist, the adapter falls back to the legacy join-based query and behavior.

Rollout guidance
1. Add the view to staging and run smoke tests against the admin UI (ensure the new view returns the expected fields).
2. If everything passes, add the view to production (CREATE OR REPLACE is safe).
3. Monitor query performance. If needed, consider `MATERIALIZED VIEW` + scheduled `REFRESH MATERIALIZED VIEW` for very large installations.

Rollback
- Removing the view is safe: `DROP VIEW IF EXISTS public.users_full;` — adapter will fall back to legacy queries.

Security & notes
- The view exposes only columns that `users` and `user_profile` already provide. Do not expose secrets (password fields) through the view.
- If sensitive columns are accidentally included in `users`, update the view SQL to omit them explicitly.

File: `sql/create-users-full-view.sql`

---
