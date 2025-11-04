# Fornecedores — Otimizações de Performance

Este documento reúne sugestões aplicadas e próximas ações para reduzir latência no endpoint `GET /api/suppliers`.

## O que foi aplicado

- `listSuppliers` agora seleciona apenas colunas necessárias (id, name, contact, contact_email, cnpj, specialty) em vez de `SELECT *`.
- `listSuppliers` aceita `limit` e `offset` para paginação.
- `createSuppliersBulk` foi convertido para um `INSERT ... VALUES (...), (...), ... RETURNING *` para reduzir round-trips no bulk.
- `GET /api/suppliers` passou a aceitar `?limit=...&offset=...` e tem cache em memória curto (TTL 5s) por chave `limit:offset`.

## Como medir (local)

1. Inicie o servidor de desenvolvimento (porta 9002):

```powershell
npm run dev
```

2. Execute o benchmark fornecido:

```powershell
node scripts/bench-suppliers.js http://localhost:9002/api/suppliers 200 20
```

Altere a URL para `http://localhost:9002/api/suppliers?limit=50&offset=0` para testar paginação.

Você também pode usar PowerShell para uma medição simples:

```powershell
(Measure-Command { Invoke-RestMethod 'http://localhost:9002/api/suppliers' }).TotalMilliseconds
```

## SQL recomendadas (execute no seu banco Postgres)

- Índice para ordenação por `name` (ajuda ORDER BY name ASC):

```sql
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);
```

- Índice para busca por `cnpj` (se você buscar por esse campo):

```sql
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers (cnpj);
```

- Se você fizer queries por `contact_email` com frequência:

```sql
CREATE INDEX IF NOT EXISTS idx_suppliers_contact_email ON suppliers (contact_email);
```

Nota: verifique se as colunas realmente existem no seu esquema. O projeto atual insere/usa essas colunas mas a criação da tabela `suppliers` não estava presente em `seed.sql` — confirme o schema antes de criar índices.

## Redis (cache persistente)

Para substituir o cache em memória por Redis (recomendado para produção com múltiplas instâncias):

1. Instale cliente Redis (ex.: `ioredis`):

```powershell
npm install ioredis
```

2. Configure `REDIS_URL` no ambiente (ex.: `redis://localhost:6379`).

3. Modifique o handler GET para usar Redis `GET`/`SETEX` na chave `suppliers:limit:offset` (TTL configurável). Prefira serializar usando JSON.

Observação: deixei o cache em memória como fallback e um comentário no código — posso implementar a versão Redis se você quiser.

## Pool e conexões (pg)

Verifique `src/lib/db.ts` para ajustar `max` connections e timeouts. Para ambientes com muitas requisições simultâneas, ajuste `max` para número adequado conforme recursos do DB e do app server.

## Frontend

- Adote paginação no cliente: solicite apenas `?limit=50&offset=...` em vez de buscar todos os fornecedores.
- Use um componente `debounce` para buscas (se houver): evita múltiplas requisições para cada tecla digitada.
- Para selects grandes, carregar opções sob demanda (typeahead) em vez de carregar todos os fornecedores.

## Bulk imports

- Para imports muito grandes, prefira `COPY FROM` do Postgres ou jobs assíncronos que processam chunks e não bloqueiam threads.

## Próximos passos que posso fazer agora

- Implementar cache Redis no `GET` (precisa instalar `ioredis` ou similar).
- Adicionar endpoints para contagem total (`/api/suppliers/count`) para facilitar paginação no frontend.
- Implementar paginação no frontend (componentes) para consumir `limit/offset`.
- Rodar benchmark local e reportar antes/depois (precisa do servidor rodando).