# Plano de Migração — Usuários e Papéis

Resumo das ações já realizadas
- Adicionada migração idempotente: `sql/migrate-unify-users.sql` (cria `auth_providers`, `user_profile`, colunas não-destrutivas em `users`).
- Adicionado backfill idempotente: `sql/backfill-user-profile.sql` (popula `user_profile.extra` com `avatarUrl`, `department`, `supplier_id`).
- Atualizado `src/server/adapters/users-adapter.ts` para anexar `roles` (nomes) e `profile` ao retornar usuários.
- Atualizado UI em `src/app/admin-panel/users/page.tsx` para usar `profile.avatar_url` quando `avatarUrl` não existir e exibir papel a partir de `user.role` ou `user.roles`.

Próximos passos (Testes e Validação)
1. Preparar DB de teste/CI com dados de `seed.sql` e criar um dump de backup.
2. Rodar migração:

```powershell
# Backup
pg_dump --dbname="postgresql://$env:PGUSER:$env:PGPASSWORD@localhost:5432/$env:PGDATABASE" -Fc -f backup-pre-users-migration.dump

# Aplicar migração
node scripts/apply_sql.js --file sql/migrate-unify-users.sql --db your_database --user postgres --host localhost --port 5432

# Aplicar backfill
node scripts/apply_sql.js --file sql/backfill-user-profile.sql --db your_database --user postgres --host localhost --port 5432
```

3. Validar no app (dev):

 - Inicie o servidor dev: `npm run dev` (porta padrão 9002).
 - Faça login como admin e abra `Admin > Usuários e Papéis`.
 - Verifique avatares, papéis e perfil (coluna `profile` no payload JSON retornado pela API).

4. Testes automáticos (recomendado):

 - Criar teste de integração que:
   - Restaura o dump de teste
   - Executa as migrações
   - Chama `/api/admin-panel/users` e valida que `profile` e `roles` existem nos objetos retornados

Rollback (opções)
- Restaurar o dump gerado antes da migração:

```powershell
pg_restore --clean --dbname="postgresql://$env:PGUSER:$env:PGPASSWORD@localhost:5432/$env:PGDATABASE" backup-pre-users-migration.dump
```

- Ou remoção manual (use com cautela):

```sql
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE users DROP COLUMN IF EXISTS created_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
DROP TABLE IF EXISTS auth_providers;
DROP TABLE IF EXISTS user_profile;
```

Checklist para PR
- Incluir migração SQL e backfill em `sql/`.
- Incluir alterações no adapter e UI (already included).
- Adicionar testes de integração que executem a migração em DB temporário.
- Verificar logs e performance da listagem `/api/admin-panel/users` (evitar N+1 em production se necessário).

Observações de desempenho
- A implementação atual anexa `roles` e `profile` por usuário com consultas separadas (N+1). Para grandes listas, converta para uma consulta SQL com JOINs/aggregates (e.g., array_agg) para reduzir roundtrips.
