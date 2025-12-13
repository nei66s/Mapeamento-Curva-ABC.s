# Deployment environment variables

This project requires the following environment variables to run in production. Keep secrets out of source control and use your cloud provider's secret management.

- `DATABASE_URL`: Full Postgres connection string. This is the only database credential the app reads and is required in every environment.
- `NODE_ENV`: Set to `production` in prod deployments.

Other useful vars

- `NEXT_PUBLIC_BASE_URL`: Public base URL for the app (used in links, defaults to `http://localhost:9002` in dev).
- `DB_LOG_QUERIES`: Set to `true` to enable DB query timing logs (avoid in prod unless troubleshooting).

Security notes

- Never commit `PGPASSWORD` or `DATABASE_URL` to source control. Use CI/CD secret stores or environment variable management.
- Ensure the database user has minimal privileges required by the app (avoid superuser in production).
- Rotate database credentials periodically and use network-level protections (VPC, IP allowlists).

Developer convenience

- Set `DATABASE_URL` in your local `.env.local` (or via `source .env.local`) to point at a local Postgres instance. The runtime now throws early if the value is missing, which makes it easier to catch deployment misconfigurations.
