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

const poolConfig = (() => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set. Configure DATABASE_URL for your environment to connect to the database.');
  }
  return {
    connectionString: databaseUrl,
    // Always allow the client to connect to managed databases that require SSL.
    ssl: { rejectUnauthorized: false },
  };
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
