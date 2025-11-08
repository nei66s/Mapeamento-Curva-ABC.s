Production Migration Checklist (Postgres + App)

App config
- Env vars: set `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.
- Optional: `REDIS_URL` for supplier cache (safe to omit).
- Run seeds: `psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f seed.sql`.
- Optional cleanup: `psql ... -f scripts/drop-unused.sql` (drops legacy `settlements`).

Database indexes (performance)
- Apply: `psql ... -f scripts/apply-indexes.sql`.
- Tables and indexes:
  - items: idx on `category_id`, `classification`, `status`.
  - store_items: idx on `store_id`, `item_id` (besides UNIQUE(store_id,item_id)).
  - incidents: idx on `opened_at`, `status`, `item_name`.
  - tools: idx on `status`, `assigned_to`.
  - technicians: idx on `name` (text pattern ops if needed).
  - technical_reports: idx on `created_at`, `technician_id`.
  - settlement_letters: idx on `date`, `supplier_id`, `status`.
  - warranty_items: idx on `supplier_id`, `warranty_end_date`.
  - vacation_requests: idx on `user_id`, `start_date`, `end_date`.

Roles and access
- Create a read/write role for the app; grant limited privileges only on app tables.
- Example outline:
  - `CREATE ROLE app_user LOGIN PASSWORD '...';`
  - `GRANT CONNECT ON DATABASE yourdb TO app_user;`
  - `GRANT USAGE ON SCHEMA public TO app_user;`
  - `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;`
  - `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;`

Backups and maintenance
- Backups: schedule pg_dump (daily full) + WAL archiving if needed.
- Monitoring: track slow queries (set `log_min_duration_statement`) and errors.
- Vacuum/Analyze: rely on autovacuum; tune if tables grow quickly.

App verification
- Smoke test all dashboards (items matrix, incidents, indicators, tools, suppliers, warranty, laudos, settlements, vacations, compliance):
  - Create/update/delete flows persist and reload correctly.
  - Image uploads (avatar/items) return valid URLs.
  - Filters, charts, and counts reflect DB state.

Deployment tips
- Use connection pooling (e.g., PgBouncer) in high‑concurrency setups.
- Keep `DB_LOG_QUERIES=true` in staging to spot slow SQL (disable in prod or reduce verbosity).

