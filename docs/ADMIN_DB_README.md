# Admin DB: criação de tabelas e seed

Este arquivo descreve como aplicar a migration que cria as tabelas de administração (roles, permissions, user_roles, role_permissions, admin_dashboard_settings) e como executar o seed que mapeia usuários já existentes.

Arquivos criados:
- `sql/create-admin-tables.sql` — migration SQL que cria tabelas e popula `roles`/`permissions` e associa `user_roles` com base em `users.role`.
- `scripts/seed-admin.ts` — script TypeScript que executa o SQL acima usando a conexão `src/lib/db.ts`.

Como aplicar (modo rápido):

1) Usando psql (recomendado para produção):

```powershell
psql -h <host> -p <port> -U <user> -d <database> -f "sql/create-admin-tables.sql"
```

2) Usando o script do projeto (recomendado para desenvolvimento local quando `PGPASSWORD` estiver configurada):

```powershell
# se usar ts-node (instalado globalmente ou no projeto)
npx ts-node scripts/seed-admin.ts

# ou, se preferir compilar para JS e executar com node:
# npx tsc scripts/seed-admin.ts --outDir dist && node dist/scripts/seed-admin.js
```

Notas e compatibilidade:
- A migration preserva a coluna `users.role` existente e adiciona a tabela normalizada `roles` e a relação `user_roles`. O INSERT para `user_roles` mapeia usuários existentes que tiverem strings de role que correspondam (case-insensitive) aos nomes de roles padrão ('admin','gestor','regional','visualizador').
- Revise `sql/create-admin-tables.sql` caso deseje adicionar permissões específicas ou personalizar o mapeamento.
- Se o banco estiver em produção faça backup antes de aplicar a migration.
