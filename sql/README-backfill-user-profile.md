# Backfill: user_profile

Este documento descreve como executar e validar o script `sql/backfill-user-profile.sql`, que copia campos de perfil existentes da tabela `users` para `user_profile.extra` (JSONB).

Pré-requisitos
- Banco Postgres acessível.
- `node` disponível (opcional: o repositório contém `scripts/apply_sql.js` para aplicar SQL).

Como executar (PowerShell)

1. Fazer backup do banco:

```powershell
pg_dump --dbname="postgresql://$env:PGUSER:$env:PGPASSWORD@localhost:5432/$env:PGDATABASE" -Fc -f backup-pre-backfill-user-profile.dump
```

2. Executar o backfill usando o script do repositório:

```powershell
node scripts/apply_sql.js --file sql/backfill-user-profile.sql --db your_database --user postgres --host localhost --port 5432
```

Validação
- Verifique algumas linhas para confirmar merge:

```sql
SELECT u.id, u.avatarUrl, p.extra
FROM users u
LEFT JOIN user_profile p ON p.user_id = u.id::text
WHERE u.email IN ('admin@gmail.com','gestor@example.com')
LIMIT 10;
```

Rollback
- Restaure o dump gerado no passo 1 ou execute manualmente para remover chaves:

```sql
UPDATE user_profile SET extra = extra - 'avatar_url' - 'department' - 'supplier_id' WHERE extra ? 'avatar_url' OR extra ? 'department' OR extra ? 'supplier_id';
```

Observações
- Este backfill evita renomear colunas existentes (`avatarUrl`) para manter o código funcionando sem mudanças imediatas.
- Próximo passo recomendado: adicionar um endpoint administrativo para gerenciar perfis e um teste de integração que rode a migração em um DB de CI.
