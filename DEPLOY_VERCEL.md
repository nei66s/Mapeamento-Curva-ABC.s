# Deploy no Vercel — instruções rápidas

Passos mínimos para publicar este projeto Next.js no Vercel:

1. Conectar repositório
   - No dashboard do Vercel, clique em "New Project" e importe o repositório.

2. Configurar variáveis de ambiente (obrigatórias para DB/serviços)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (se usar Postgres).
   - `NEXT_PUBLIC_*` para chaves públicas usadas no cliente.
   - Qualquer secret usado em `src/ai` ou integrações (ex.: `GOOGLE_API_KEY`).

3. Build & Settings
   - Build Command: `npm run build` (definido em `vercel.json`).
   - Output Directory: (Vercel detecta Next.js automaticamente; não alterar).
   - Node Version: selecione `20.x` no Project Settings → General → Environment → Node.js.

4. Registros e arquivos grandes
   - O diretório `public/uploads` é referenciado localmente; considere usar um storage externo (S3, etc.) para arquivos de produção.

5. Pós-deploy
   - Teste rotas que dependem de serviços externos (DB, Redis, email).
   - Configure _Environment Variables_ e _Secrets_ via Vercel UI antes do primeiro deploy de produção.

Notas técnicas e alterações aplicadas
- Adicionado `engines.node: "20.x"` em `package.json` para alinhar com o runtime.
- `vercel.json` recebeu `version: 2` e `buildCommand` explícito.
- Adicionado `.vercelignore` para reduzir upload de artefatos grandes/locais.

Se quiser, posso também:
- Adicionar um workflow GitHub Actions que cria previews automaticamente.
- Documentar variáveis de ambiente específicas do projeto (recorrer a `src/lib/db.ts`).
