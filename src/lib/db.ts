// @ts-nocheck
/* eslint-disable */
/**
 * Database connection - SERVER ONLY
 * This file should NEVER be imported in client components
 * Use .server.ts files for database operations
 */

import { Pool } from 'pg';

// Basic Pool with optional instrumentation. When DB_LOG_QUERIES is set to 'true',
// we log query durations (ms) to help identify slow queries.

const isProd = process.env.NODE_ENV === 'production';
const resolvePassword = () => {
  if (isProd) {
    if (!process.env.PGPASSWORD) {
      throw new Error('PGPASSWORD environment variable is not set. Set PGPASSWORD to connect to the DB (production).');
    }
    return process.env.PGPASSWORD as string;
  }

  if (!process.env.PGPASSWORD) {
    const allowDefault = String(process.env.DEV_ALLOW_DEFAULT_PG_PASSWORD || '').toLowerCase() === 'true';
    if (allowDefault) {
      // eslint-disable-next-line no-console
      console.warn("DEV_ALLOW_DEFAULT_PG_PASSWORD=true — using 'admin' fallback for development only. Do not use in production.");
      return 'admin';
    }
    throw new Error('PGPASSWORD not set. In development you can run scripts/dev-setup.ps1 or set DEV_ALLOW_DEFAULT_PG_PASSWORD=true to allow a local fallback.');
  }
  return process.env.PGPASSWORD as string;
};

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'mapeamento_user',
      password: resolvePassword(),
      database: process.env.PGDATABASE || 'mapeamento',
    };

const pool = new Pool(poolConfig);

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
