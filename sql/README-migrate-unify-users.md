# Migração: unify-users

Este README explica como executar a migração `sql/migrate-unify-users.sql`, que adiciona colunas não-destrutivas à tabela `users` e cria as tabelas `auth_providers` e `user_profile`.

ATENÇÃO: sempre faça backup antes de rodar em produção.

Pré-requisitos
- Acesso ao banco Postgres usado pela aplicação.
- `node` e dependências do projeto (opcional para usar `scripts/apply_sql.js`).

Como rodar (PowerShell)

1. Fazer backup do banco (exemplo):

```powershell
pg_dump --dbname="postgresql://$env:PGUSER:$env:PGPASSWORD@localhost:5432/$env:PGDATABASE" -Fc -f backup-pre-unify-users.dump
```

2. Executar a migração usando o script de aplicação SQL do repositório:

```powershell
node scripts/apply_sql.js --file sql/migrate-unify-users.sql --db your_database --user postgres --host localhost --port 5432
```

Se o seu ambiente usa variáveis, substitua `your_database`/`postgres`/`localhost` conforme necessário.

Observações importantes
- A migração é projetada para ser idempotente e não-destrutiva: usa `ADD COLUMN IF NOT EXISTS` e `CREATE TABLE IF NOT EXISTS`.
- Ela NÃO altera tipos de chaves primárias existentes (`users.id`) nem remove colunas. Isso reduz o risco de romper dependências existentes.
- O bloco que popula `user_roles` a partir de `users.role` é idempotente e só insere registros quando houver correspondência entre `users.role` e `roles.name`.

Rollback (manual)
- Caso precise reverter, opções comuns:
  - Restaure o dump gerado pelo `pg_dump` acima:

```powershell
pg_restore --clean --dbname="postgresql://$env:PGUSER:$env:PGPASSWORD@localhost:5432/$env:PGDATABASE" backup-pre-unify-users.dump
```

  - Ou executar manualmente SQL de remoção (use com cuidado):

```sql
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE users DROP COLUMN IF EXISTS created_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
DROP TABLE IF EXISTS auth_providers;
DROP TABLE IF EXISTS user_profile;
-- NOTE: não remova user_roles se outras partes do app já dependem dela.
```

Próximos passos recomendados
- Revisar referências no código que assumem a presença de `users.role` e migrar para `user_roles` quando fizer sentido.
- Implementar endpoint administrativo para gerenciar `user_roles` e `auth_providers`.
- Escrever testes de integração que validem login, leitura de `user_settings` e histórico (`user_history`) após a migração.
