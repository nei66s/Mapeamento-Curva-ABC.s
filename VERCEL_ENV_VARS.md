# Variáveis de ambiente para deploy no Vercel

Este arquivo resume as variáveis de ambiente que o projeto usa e que você deve configurar no painel do Vercel (Project → Settings → Environment Variables) e/ou no GitHub Secrets para o workflow.

Essenciais (produção):
- `DATABASE_URL` (opcional): string de conexão Postgres. Se definido, sobrescreve `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`.
	- Exemplo: `postgres://user:password@db.example.com:5432/mapeamento`
- `PGHOST`: host do Postgres (ex.: `db.example.com`).
	- Exemplo: `db.example.com`
- `PGPORT`: porta do Postgres (padrão `5432`).
	- Exemplo: `5432`
- `PGUSER`: usuário do Postgres.
	- Exemplo: `mapeamento_user`
- `PGPASSWORD`: senha do Postgres (obrigatório em produção — `src/lib/db.ts` lança se não estiver definido em produção).
	- Exemplo: `S3cur3P@ssw0rd` (use secrets)
- `PGDATABASE`: nome do banco.
	- Exemplo: `mapeamento`

Opções/depuração:
- `DEV_ALLOW_DEFAULT_PG_PASSWORD`: em dev permite fallback `admin` quando `PGPASSWORD` não estiver definido (setar `true` só localmente).
	- Exemplo (somente local): `true`
- `DB_LOG_QUERIES`: `true` para log de durações de queries (útil em debug/production troubleshooting).
	- Exemplo: `true` ou `false`

AI / integrações (server-side):
- `GOOGLE_API_KEY` ou `GOOGLE_APPLICATION_CREDENTIALS`: usados por `src/ai/genkit.ts` para inicializar o plugin Google GenAI (ver `src/ai/genkit.ts`).
	- Exemplo: `GOOGLE_API_KEY=AIza...` ou `GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds.json` (use Vercel secrets — prefira `GOOGLE_API_KEY` para runtime simples)

Public / cliente (`NEXT_PUBLIC_*`):
- `NEXT_PUBLIC_API_BASE_URL`: base para chamadas de API no cliente (padrão `/api`).
	- Exemplo: `/api`
- `NEXT_PUBLIC_TRACKING_ENDPOINT`: endpoint para tracking (padrão `/api/admin/tracking`).
	- Exemplo: `/api/admin/tracking`
- `NEXT_PUBLIC_REALTIME_POLL_INTERVAL` e `NEXT_PUBLIC_SLOW_REALTIME_POLL_INTERVAL`: inteiros em ms para polling.
	- Exemplo: `NEXT_PUBLIC_REALTIME_POLL_INTERVAL=5000`
	- Exemplo: `NEXT_PUBLIC_SLOW_REALTIME_POLL_INTERVAL=10000`
- `NEXT_PUBLIC_BASE_URL`: base pública usada em links (ex.: `https://meu-app.vercel.app`).
	- Exemplo: `https://meu-app.vercel.app`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: se o app usa Google Maps no cliente.
	- Exemplo: (restrinja por domínio) `AIzaSy...`

Vercel / CI (GitHub Actions):
- `VERCEL_TOKEN`: token pessoal (create at https://vercel.com/account) — necessário para `npx vercel` no workflow.
	- Como obter: Vercel Dashboard → Account → Tokens → Create Token
- `VERCEL_ORG_ID`: opcional, ajuda a selecionar a organização
	- Como obter: Vercel Dashboard → Project Settings → General → Organization ID
- `VERCEL_PROJECT_ID`: opcional, ajuda a selecionar o projeto explicitamente
	- Como obter: Vercel Dashboard → Project Settings → General → Project ID

E-mail / envio de mensagens:
- Caso use `nodemailer` ou SES, configure as variáveis correspondentes no provedor (ex.: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) ou `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` para SES.
	- Exemplo (SMTP): `SMTP_HOST=smtp.mailgun.org`, `SMTP_PORT=587`, `SMTP_USER=postmaster@...`, `SMTP_PASS=...`

Como configurar:
1. No Vercel: Project → Settings → Environment Variables, adicione as variáveis para `Production` (e `Preview` se desejar).
2. No GitHub Actions: em Settings → Secrets → Actions, crie `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` (caso deseje manter o deploy via Actions).

Notas de segurança:
- Nunca comite senhas ou chaves em repositórios públicos. Use os Secrets do GitHub e as Environment Variables do Vercel.
- Teste o build localmente antes de enviar para produção: `npm ci && npm run build`.

- Se quiser, eu filtro e listo todas as `NEXT_PUBLIC_*` que aparecem no código atualmente.
