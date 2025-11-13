How to apply `seed.sql` (creates missing tables like `unsalvageable_items`)

Requirements
- A running Postgres instance reachable from this machine
- The DB user must accept password via `PGPASSWORD` environment variable or `--password` argument

Quick (PowerShell) example:

```powershell
# set DB password in env var for the session
$env:PGPASSWORD = 'your_db_password'
# run the seed (defaults to host localhost, user postgres, port 5432)
# replace --db with your database name if different
node scripts/apply_sql.js --file seed.sql --db your_database --user postgres --host localhost --port 5432
```

You can also use the npm script added to `package.json`:

```powershell
$env:PGPASSWORD = 'your_db_password'
npm run db:seed -- --db your_database --user postgres --host localhost
```

Notes
- `seed.sql` already contains `CREATE TABLE IF NOT EXISTS unsalvageable_items (...)` and example inserts, so running the seed will create the missing relation reported in the server logs.
- If you prefer to apply only the table creation, edit `seed.sql` or extract the `unsalvageable_items` CREATE TABLE block into a smaller SQL file and point `--file` to it.
- `scripts/apply_sql.js` expects `PGPASSWORD` to be set or `--password` to be passed explicitly.
