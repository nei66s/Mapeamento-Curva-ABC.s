# Deployment environment variables

This project requires the following environment variables to run in production. Keep secrets out of source control and use your cloud provider's secret management.

- `DATABASE_URL` (optional): Full Postgres connection string. If present, it takes precedence over individual PG_* vars.
- `PGHOST`: Postgres host (when `DATABASE_URL` is not used).
- `PGPORT`: Postgres port (default: `5432`).
- `PGUSER`: Postgres user.
- `PGPASSWORD`: Postgres password. REQUIRED in production.
- `PGDATABASE`: Postgres database name.
- `NODE_ENV`: Set to `production` in prod deployments.

Other useful vars

- `NEXT_PUBLIC_BASE_URL`: Public base URL for the app (used in links, defaults to `http://localhost:9002` in dev).
- `DB_LOG_QUERIES`: Set to `true` to enable DB query timing logs (avoid in prod unless troubleshooting).

Security notes

- Never commit `PGPASSWORD` or `DATABASE_URL` to source control. Use CI/CD secret stores or environment variable management.
- Ensure the database user has minimal privileges required by the app (avoid superuser in production).
- Rotate database credentials periodically and use network-level protections (VPC, IP allowlists).

Developer convenience

- For local development, the repo supports a fallback password when `DEV_ALLOW_DEFAULT_PG_PASSWORD=true`. This is unsafe for production and should not be set in production environments.
