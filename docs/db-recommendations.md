# Database recommendations

This document summarizes recommended Postgres settings and actions to keep a healthy relationship between the app and the DB.

## Connection pool
- The application uses `src/lib/db.ts` which wraps `pg.Pool`.
- Tune the pool `max` (default 10) according to application concurrency and DB capacity. A general rule: `max_connections = app_servers * threads_per_server + margin`.

## Backups
- Schedule nightly pg_dump or filesystem snapshots for production.
- Test restores regularly.

## Vacuum / Analyze
- Run VACUUM (ANALYZE) periodically during low traffic windows. The `scripts/db-maintenance.ps1` includes a helper to run VACUUM ANALYZE on `public`.

## Indexes and queries
- Use `EXPLAIN (ANALYZE, BUFFERS)` to verify slow queries.
- The repo includes `sql/list-unused-tables-fast.sql` which uses catalog tables for speed.
- For the audit table, indexes on `table_name` and `dropped_at` are recommended (created by `sql/audit-helpers.sql` and `scripts/db-maintenance.ps1`).

## Monitoring
- Enable `pg_stat_statements` in Postgres to track query cost/latency over time.
- Capture slow queries and optimize them.

## Schema separation
- Keep audit tables in a separate schema (e.g., `audit`) to avoid interfering with application logic and discovery scripts.

## Security
- Use strong passwords and DB users with minimal privileges for app connections.
- Prefer environment-based secrets (e.g., vault, cloud secret manager) in production.

***

If you'd like, I can generate a sample `postgres.conf` with suggested settings for shared_buffers, work_mem, max_connections, and autovacuum tuning based on target RAM—tell me the DB server RAM and I'll produce tuned recommendations.
