# Notas de Correção — Compliance (Preventivas)

Este repositório recebeu uma correção no fluxo de atualização de status das checklists de preventivas (rota `/api/compliance`). O objetivo foi resolver um problema em que, ao marcar um item como "Concluído", a UI mostrava um PUT 200, mas o ícone, a barra de progresso e a contagem de itens concluídos não eram atualizados persistentemente.

Resumo da correção

- Problema identificado:
  - Inconsistências entre os valores de status armazenados no banco (ex.: valores em Português como "Concluído") e os valores esperados pelo frontend (`'completed' | 'pending' | 'not-applicable'`).
  - Comparações entre IDs de item falhavam quando o banco usava tipos diferentes (inteiro vs texto), fazendo com que a atualização não encontrasse o item correto dentro do JSON `items` ou em tabelas normalizadas.

- O que foi alterado:
  - `src/lib/compliance.server.ts`
    - Adicionada função `normalizeStatus(...)` que mapeia variantes em PT/EN para as chaves internas: `completed`, `pending`, `not-applicable`.
    - Ao ler `items` do banco (tanto em `compliance_visits` JSONB quanto em tabelas normalizadas) agora os status são normalizados com `normalizeStatus(...)`.
    - Comparações de `itemId` agora são feitas com coerção para string (evita mismatch `int` vs `text`). Queries `UPDATE` em tabelas normalizadas comparam a coluna de item como texto (`${itemCol}::text = $5::text`) para robustez.

Como isso resolve o comportamento observado

- Quando a UI envia o PUT com `status: 'Concluído'` ou valores vindos do banco em PT, o servidor agora converte esses valores para `'completed'` antes de enviar para o frontend. Assim os componentes que escolhem ícones e contam itens (que esperam os valores em inglês) passam a reconhecer corretamente o estado.
- Comparações e updates falham menos quando IDs têm tipos diferentes — evitando que a alteração pareça suceder (200) mas não seja aplicada no DB.

Arquivos modificados

- `src/lib/compliance.server.ts` — normalização de status, coerção de IDs e ajustes em queries.

Como testar localmente

## Local development: Postgres credentials

The app connects to Postgres using environment variables: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

To run the app locally during development you can use the helper script:

PowerShell (recommended on Windows):

  .\\scripts\\dev-setup.ps1
  npm run dev

This sets `PGPASSWORD=admin` for the session and `DEV_ALLOW_DEFAULT_PG_PASSWORD=true` so the app permits a local default password for convenience.

Important security note: Do NOT use the `admin` fallback in production. In production, always set a real `PGPASSWORD` via your secret management system. The app now requires `PGPASSWORD` in production and will refuse to start without it.

1. Reinicie o servidor de desenvolvimento (caso esteja rodando):

```powershell
npm run dev
```

2. Abra a página Preventivas (/dashboard/compliance).

3. Altere um item de status de "Pendente" para "Concluído" através do menu do item.

4. Verifique:
   - O ícone deve mudar imediatamente (optimistic UI).
   - A barra de progresso no resumo (`ComplianceSummary`) deve atualizar para refletir a nova porcentagem.
   - Ao recarregar a página, o status deve permanecer como "Concluído" (persistido no banco).

Diagnóstico adicional (se algo falhar)

- Verifique os logs do servidor (`npm run dev`) ao executar a alteração — o endpoint PUT `/api/compliance` agora retorna mensagens de erro/diagnóstico quando apropriado.
- Se ainda houver problema, cole aqui o output do console do servidor e um exemplo do `items` salvo na tabela `compliance_visits`, por exemplo:

```sql
SELECT id, store_id, visit_date, items
FROM compliance_visits
WHERE store_id = 'LOJA-1'
LIMIT 1;
```

Notas e próximos passos recomendados

- Opcional: posso adicionar logs temporários mais detalhados na rota PUT para ajudar em debugging remoto e depois removê-los.
- Opcional: aplicar casts adicionais (por exemplo em `store_id`/`visit_date`) ou validar modelos JSON antes de persistir.

Se quiser, eu abro um PR com essa alteração e uma pequena descrição do commit para facilitar revisão/merge.

---

Última modificação: correção aplicada na branch atual. Se precisar que eu mova isso para outra branch ou crie um PR, diga o destino (ex: `main` ou `develop`).

## Remoção de avatar de usuário

Foi adicionada a funcionalidade para remover a foto de perfil (avatar) de um usuário.

- Endpoint: `DELETE /api/users/avatar?id=<USER_ID>`
- Comportamento do backend:
  - Busca o usuário pelo `id`.
  - Se a URL do avatar apontar para `public/uploads/...`, tenta apagar o arquivo físico com segurança.
  - Atualiza o registro do usuário definindo `avatarUrl = NULL`.
  - Retorna o usuário atualizado (sem a senha).

No front-end (página "Meu Perfil"), há um botão "Remover Foto" que chama esse endpoint e atualiza o estado do usuário imediatamente.
