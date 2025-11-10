<!-- .github/copilot-instructions.md - guidance for AI coding agents -->
# Copilot / AI Agent Quick Instructions

Responda sucintamente: 1 frase.

This project is a Next.js (app router) TypeScript monorepo-style webapp for maintenance/operations dashboards and scripts. Keep guidance concise and focused on patterns discoverable in the repo.

Key facts
- Run (development): `npm run dev` (root) — Next runs on port 9002. The app uses custom webpack flags in root `package.json`.
- DB: uses Postgres via `src/lib/db.ts`. Server-only DB code must not be imported into client components.
- Server-only files: prefer `*.server.ts` for database or privileged code; API routes live under `src/app/api/*` and return JSON consumed by client components (e.g. `/api/indicators`, `/api/incidents`).
- AI integrations: repo uses `genkit` and `@genkit-ai/*` packages located in `src/ai` and `src` scripts. Be careful when editing AI flows — watch `src/ai/dev.ts` and `src/ai/genkit.ts`.

Architecture / important files to reference
- `src/app/layout.tsx` — global layout, header and sidebar composition; components rendered under `RequirePermission` (auth gating).
- `src/lib/db.ts` — Postgres Pool; environment variables: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and optional `DB_LOG_QUERIES` to enable timing logs.
- `src/app/indicators/page.tsx` — example of client page fetching APIs and controlling sync/build flows using POST endpoints: `/api/sync-lancamentos`, `/api/build-indicators`, and `/api/seed-targeted`.
- `scripts/` — many DB and data utilities (seed, migrate, apply-indexes). Use them for data setup and diagnostics (examples: `scripts/seed-items.js`, `scripts/run-seed.js`, `scripts/apply-indexes.ps1`).

Project-specific conventions & patterns
- Separation of server vs client: files under `src/lib/*.server.ts` or explicit server-only imports for DB operations. NEVER import `src/lib/db.ts` into client components.
- JSON-based migrations and ad-hoc scripts in `scripts/` are used instead of a formal migration framework in parts of the codebase. When modifying schema-related code, check `scripts/` for helpers to re-seed or rebuild derived materialized views.
- API endpoints are lightweight JSON endpoints intended for client fetch; many endpoints return `{ ok: true, result }` shape. Follow existing shapes when adding new endpoints.
- Locale and normalization: several server modules normalize Portuguese/English status values (see compliance code references in README). Prefer creating small `normalizeX` helpers near similar domain logic.

Developer workflows (commands & environment)
- Start dev server: `npm run dev` (root). Port 9002. If you change migrations or DB schema, restart server.
- Typecheck and tests: `npm run typecheck` and `npm run test` (vitest). Use `npm run test:normalize` for status normalization checks.
- Seed/migrate: Many helpers under `scripts/` and `src/lib/migrate-*.ts` (see `package.json` scripts: `migrate:store-items`, `migrate:indicators`, `migrate:all`). Use `ts-node` where needed.

Integration points & gotchas
- Postgres is the canonical datastore. `src/lib/db.ts` wraps a `pg.Pool`. Use parameterized queries and prefer server-only modules for DB access.
- File uploads use `public/uploads/*` (avatars, categories, items). When removing files, code checks path prefix before unlinking.
- The UI expects specific enum/string values for statuses (e.g., `completed`, `pending`, `not-applicable`). If you add endpoints or change persisted values, ensure server normalizes variants from Portuguese or other sources.
- Some queries rely on coerced types (e.g., comparing item IDs as text). Search for `::text` casts in SQL helpers when editing DB code.

Small examples (from the repo)
- The indicators page performs these requests in `src/app/indicators/page.tsx`:
  - GET `/api/indicators`
  - GET `/api/incidents`
  - POST `/api/sync-lancamentos` then POST `/api/build-indicators` for rebuild flows
  - POST `/api/seed-targeted` for demo data

Style & behavior expectations
- Keep PRs small and focused when changing DB or API shapes. Add a data migration or seed script when changing persisted formats.
- Preserve optimistic UI and API error shape (`{ ok: boolean, error?: string, result?: any }`). Client code relies on `ok` checks.
- Tests: add a small Vitest test for any new domain logic (1 happy path + 1 edge case) where feasible.

If anything is unclear or you'd like examples for a particular area (DB access patterns, API handler template, or seeding flows), tell me which part and I'll expand the instructions.

Last updated: auto-generated from repo scan.
