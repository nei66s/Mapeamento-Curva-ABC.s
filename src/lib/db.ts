// @ts-nocheck
/* eslint-disable */
/**
 * Database connection - SERVER ONLY
 * This file should NEVER be imported in client components
 * Use .server.ts files for database operations
 */

import { Pool } from 'pg';
// initialize server-side error logger (registers process handlers)
import '@/server/error-logger';

// Basic Pool with optional instrumentation. When DB_LOG_QUERIES is set to 'true',
// we log query durations (ms) to help identify slow queries.

const isProd = process.env.NODE_ENV === 'production';

// Prefer a single `DATABASE_URL` env var. This removes reliance on scattered
// PGHOST/PGUSER/PGPASSWORD/PGPORT variables and is compatible with serverless
// environments (Vercel). In production `DATABASE_URL` must be set.
// In development you can set `DEV_ALLOW_DEFAULT_PG_PASSWORD=true` to allow a
// simple local fallback connection string for convenience.
const poolConfig = (() => {
  if (process.env.DATABASE_URL) {
    // Ensure SSL for managed DBs (Supabase) when a URL is provided.
    return { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } };
  }

  // No DATABASE_URL provided
  if (isProd) {
    throw new Error('DATABASE_URL not set. Set DATABASE_URL in production to connect to the DB.');
  }

  // Development fallback when explicitly allowed.
  const allowDefault = String(process.env.DEV_ALLOW_DEFAULT_PG_PASSWORD || '').toLowerCase() === 'true';
  if (allowDefault) {
    // Local dev fallback: do not read PG* env vars; use a simple default URL.
    // NOTE: this is for convenience only. Prefer setting DATABASE_URL locally.
    // eslint-disable-next-line no-console
    console.warn("DEV_ALLOW_DEFAULT_PG_PASSWORD=true — using local fallback DATABASE_URL for development only.");
    return { connectionString: 'postgres://mapeamento_user:admin@localhost:5432/mapeamento' };
  }

  // If we're here, the developer forgot to set DATABASE_URL in non-production.
  throw new Error('DATABASE_URL not set. Set DATABASE_URL in your environment (or set DEV_ALLOW_DEFAULT_PG_PASSWORD=true for local dev).');
})();

const pool = new Pool(poolConfig);

// No lazy password validation required: production will error early if DATABASE_URL is absent.
const originalConnect = pool.connect.bind(pool);
pool.connect = async (...args: any[]) => {
  // @ts-ignore
  return originalConnect(...args);
};

if ((pool as any).query) {
  const originalQuery = pool.query.bind(pool);
  // @ts-ignore
  pool.query = async (...args: any[]) => {
    return originalQuery(...args);
  };
}

// Wrap query to measure duration when requested
if (process.env.DB_LOG_QUERIES === 'true') {
  const realQuery = pool.query.bind(pool);
  // @ts-ignore
  pool.query = async (...args: any[]) => {
    const start = Date.now();
    try {
      const res = await realQuery(...args);
      const dt = Date.now() - start;
      try {
        const text = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].text) || '<prepared>'; 
        console.debug('[db] query finished', { durationMs: dt, sql: (text || '').slice(0, 200) });
      } catch (err) {
        // ignore logging errors
      }
      return res;
    } catch (err) {
      const dt = Date.now() - start;
      console.error('[db] query error', { durationMs: dt, err });
      throw err;
    }
  };
}

export default pool;
