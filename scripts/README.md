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
