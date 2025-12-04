<!-- .github/copilot-instructions.md - guidance for AI coding agents -->
# Copilot / AI Agent Quick Instructions

Responda sucintamente: 1 frase.
This project is a Next.js (app-router) TypeScript webapp with utility scripts and AI flows. Keep guidance concise and focused on discoverable patterns.

Key facts (high-value)
- Dev: `npm run dev` — on Windows this runs `scripts/start-dev.ps1` (PowerShell wrapper). App commonly runs on port `9002`.
- Genkit/AI: `npm run genkit:dev` and `npm run genkit:watch` drive `src/ai/dev.ts`. Inspect `src/ai/genkit.ts` for integrations.
- Build/start: `npm run build` / `npm run start` / `npm run prod`.
- DB: Postgres via `src/lib/db.ts` (uses `pg.Pool`). Env vars: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, optional `DB_LOG_QUERIES`.
- Scripts/migrations: many commands use `ts-node` (`migrate:all`, `migrate:indicators`, `migrate:store-items`, `db:seed`, `db:fix-*`).

Architecture & important files to read
- `src/app/layout.tsx` — global layout + auth gating (`RequirePermission`). Changes here affect the whole UI.
- `src/lib/db.ts` — central DB pool and helpers; do not import it into client bundles.
- `src/app/api/*` — server API routes returning `{ ok, result?, error? }` consumed by pages.
- `src/app/indicators/page.tsx` — concrete example for client → API flows and rebuild sequences.
- `src/ai/dev.ts`, `src/ai/genkit.ts` — AI flows. Run `npm run genkit:dev` while iterating.
- `scripts/` & `sql/` — seeds, ad-hoc migrations, and DB helpers. Add migration/seed scripts alongside schema changes.

Conventions & gotchas (project-specific)
- Server-only naming: prefer `*.server.ts` or server-only directories. NEVER import server-only modules (esp. DB) into client components.
- API response shape: always use `{ ok: boolean, result?: any, error?: string }` to keep clients stable.
- Status normalization: code normalizes Portuguese/English values — add `normalizeX` helpers close to domain logic.
- File safety: uploaded files live in `public/uploads/*`. Deletion routines verify path prefixes before unlinking.
- SQL formatting: some queries use `::text` casts; watch for coerced types when editing queries.

Developer workflows (practical commands)
- Start dev (PowerShell on Windows):
  - `npm run dev`
- Run AI flows while developing:
  - `npm run genkit:dev`
  - `npm run genkit:watch`
- Typecheck & tests:
  - `npm run typecheck`
  - `npm run test` (vitest)
  - `npm run test:normalize` (domain normalization checks)
- Migrations & seeds:
  - `npm run migrate:all`
  - `npm run migrate:indicators`
  - `npm run db:seed`

Integration points & reviewer checklist
- Check `src/lib/db.ts` and `scripts/` when changing data shapes; include seed/migration and a short reproduction script.
- If touching auth or layout, inspect `src/app/layout.tsx` and `RequirePermission` usage.
- For AI changes, run `npm run genkit:dev` and review `src/ai/dev.ts` logs; avoid exposing secrets in flows.

Examples (concrete references)
- Client flow example: `src/app/indicators/page.tsx` uses `GET /api/indicators`, `POST /api/sync-lancamentos`, `POST /api/build-indicators`.
- Useful scripts in `package.json`: `dev`, `genkit:dev`, `migrate:all`, `db:seed`, `db:fix-schema`.

Style & PR expectations
- Keep DB/API changes small and isolated; add migration/seed scripts and a short test when changing persisted formats.
- Preserve the `{ ok, result, error }` API shape.
- Add compact Vitest tests for new domain logic (1 happy path + 1 edge case) when practical.

If a section is unclear or you want more examples (DB helpers, AI flow internals, or a PR checklist), tell me which area and I'll expand.

Last updated: Dec 2025
