# Cron Jobs (Vercel)

This project exposes a serverless cron endpoint at `/api/cron` and is protected
by a `CRON_SECRET` environment variable. Vercel injects the secret into the
`Authorization` header when invoking the cron.

Setup
- Add `CRON_SECRET` to your Vercel Project Environment Variables (Production).

Example request header enforced by the route:

Authorization: Bearer <your-secret>

Testing locally (replace with your secret and deployment URL):

```bash
CRON_SECRET=your-secret
curl -i -H "Authorization: Bearer $CRON_SECRET" https://<your-deployment>/api/cron
```

Implementation notes
- The route performs a safe DB smoke-check (`SELECT now()`) and returns `ranAt`.
- Replace the smoke-check with your real cron tasks (DB sync, cleanup, enqueue).
- Keep tasks short; for long-running jobs prefer a background worker or queue.
Optional DB logging
- A helper migration `sql/create-cron-runs.sql` is included to record runs in a
	`cron_runs` table. To create it, run:

```bash
psql "$DATABASE_URL" -f sql/create-cron-runs.sql
```

After creating the table, the cron endpoint will insert a `running` row at
start and update it to `success` or `failed` with payload/error details.

If you want, I can add an example task (indexing, store sync) to the route.
