Seed admin modules & feature flags

This folder contains `seed-admin-modules-and-flags.js`, a small idempotent Node script
that ensures the admin-related tables and default rows exist in your Postgres database.

What it does
- Applies `sql/create-admin-tables.sql` (CREATE TABLE IF NOT EXISTS ...).
- Runs `sql/seed-admin-modules-and-flags.sql` (INSERT ... ON CONFLICT DO UPDATE) to populate
  modules and feature flags used by the admin UI.

Usage
- Using environment variables (recommended for local dev):
```
$env:PGPASSWORD = 'your_db_password'
node .\scripts\seed-admin-modules-and-flags.js
```

- Passing password via CLI:
```
node .\scripts\seed-admin-modules-and-flags.js --password your_db_password
```

- Using a full connection URL (e.g. to target the main DB):
```
node .\scripts\seed-admin-modules-and-flags.js --database-url "postgres://user:pass@host:5432/dbname"
```

- Or use the `--use-main-db` flag together with `MAIN_DATABASE_URL` env var:
```
$env:MAIN_DATABASE_URL = 'postgres://user:pass@host:5432/dbname'
node .\scripts\seed-admin-modules-and-flags.js --use-main-db
```

Notes & safety
- The SQL files are idempotent: running the script multiple times will not create duplicate rows.
- The script splits SQL by `;\n` to execute statements sequentially — it's simple and intended for
  migration/seed-style files (not complex function bodies).
- In production, prefer running migrations through your usual deployment/migration tooling.

Troubleshooting
- If you see connection errors, verify `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` or use
  `--database-url`.
- If a statement fails, the script prints the failing statement and exits with code 1.
# Scripts: safe table cleanup

Usage:

- Dry-run (preview unused public tables):
```powershell
$env:PGPASSWORD='yourpass'; $env:PGUSER='postgres'; $env:PGDATABASE='postgres'; node .\scripts\drop-unused-safe.js
```

- Execute (destructive) — will DROP and write audit rows to `audit.admin_dropped_tables`:
```powershell
$env:PGPASSWORD='yourpass'; $env:PGUSER='postgres'; $env:PGDATABASE='postgres'; node .\scripts\drop-unused-safe.js --execute
```

- Migrate existing audit data from `public.admin_dropped_tables` into `audit.admin_dropped_tables`:
```powershell
$env:PGPASSWORD='yourpass'; $env:PGUSER='postgres'; $env:PGDATABASE='postgres'; node .\scripts\move-audit-to-schema.js
```

Notes:
- Scripts exclude the `audit` schema explicitly. The whitelist lives at `scripts/table-whitelist.js`.
- Always take a DB backup before using `--execute` (pg_dump / snapshot).
- Use `sql/audit-helpers.sql` to create the audit table and helper function in DB for best performance.
Check Lançamentos Stats

Este utilitário Node.js executa 3 queries básicas contra a tabela `public.lancamentos_mensais` e imprime os resultados.

Requisitos:
- Node.js (>=14)
- A variável de ambiente PGPASSWORD configurada ou passe `--password` ao script (recomendado usar PGPASSWORD para não deixar a senha em argumentos visíveis)

Instalação e execução (PowerShell):

cd scripts
npm install
$env:PGPASSWORD = 'SUA_SENHA'
node check_lancamentos_stats.js --host localhost --user postgres --db mydb

Remova a variável de ambiente ao terminar:

Remove-Item Env:PGPASSWORD

Saída esperada:
- count: <número de linhas>
- min_max: { min_date: 'YYYY-MM-DD', max_date: 'YYYY-MM-DD' }
- sample_rows: (até 5 linhas com id, data_lancamento e valor)

Se quiser que o script peça a senha de forma interativa com input oculto, eu posso estender o script; informe se prefere essa opção.
