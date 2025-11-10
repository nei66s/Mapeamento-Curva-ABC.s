# Deploy (Vercel) — quick guide

This project is a Next.js app. This document explains how to deploy it to Vercel and wire a free Postgres (e.g. Supabase).

1) Push your code to GitHub

- This repo already has a remote set. The branch created by the automation is `deploy/vercel-setup`.

2) Create a Vercel project

- Go to https://vercel.com and sign in with GitHub. Import this repository.
- Vercel usually detects Next.js automatically. Build command: `npm run build`. Output: default.

3) Create a Postgres (Supabase) project (optional but recommended)

- Visit https://app.supabase.com and create a free project.
- After creation, copy the connection string (postgres://...)

4) Set environment variables in Vercel

- In your Vercel project Settings → Environment Variables, add the following (for production):
  - `PGHOST` — host from Supabase
  - `PGPORT` — port (usually 5432)
  - `PGUSER` — DB user
  - `PGPASSWORD` — DB password
  - `PGDATABASE` — DB name
  - or set `DATABASE_URL` with the full connection string
  - `DB_LOG_QUERIES` — optional, `true` to log query timings

5) GitHub Actions (optional)

- This repo contains `.github/workflows/vercel-deploy.yml` that will deploy the `deploy/vercel-setup` branch to Vercel when pushed.
- To use it, add the following GitHub Secrets in the repository settings:
  - `VERCEL_TOKEN` (create from Vercel Account → Tokens)
  - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (found in your Vercel project settings)

6) Security notes

- Never commit `.env.local` or real credentials. Use `.env.example` as a template.
- Use Vercel/GitHub secrets for production credentials.

7) If you want me to open a Pull Request with these files, I created branch `deploy/vercel-setup` and pushed it. Check the PR on GitHub.
