// @ts-nocheck
/* eslint-disable */
/**
 * Database connection - SERVER ONLY
 * This file should NEVER be imported in client components
 * Use .server.ts files for database operations
 */

import { execFileSync } from 'child_process';
import { Pool } from 'pg';
// initialize server-side error logger (registers process handlers)
// Try path-alias import first (works inside Next/ts-node with path support),
// fall back to a relative require so plain Node runs (scripts) still work.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@/server/error-logger');
} catch (e) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../server/error-logger');
  } catch (err) {
    // If both fail, swallow — DB should still throw meaningful errors later.
  }
}

// Basic Pool with optional instrumentation. When DB_LOG_QUERIES is set to 'true',
// we log query durations (ms) to help identify slow queries.

type DnsLookupResult = {
  address: string;
  family: number;
};

const resolveHostname = (hostname: string): DnsLookupResult => {
  const script = `
    const dns = require('dns');
    const args = process.argv.slice(1);
    const host = args.find(arg => !!arg && arg !== '--');
    if (!host) {
      console.error(JSON.stringify({ error: 'hostname argument missing' }));
      process.exit(1);
    }
    dns.lookup(host, { family: 0 }, (err, address, family) => {
      if (err) {
        console.error(JSON.stringify({ error: err.message || err.toString(), stack: err.stack || null }));
        process.exit(2);
      }
      console.log(JSON.stringify({ address, family }));
    });
  `;

  try {
    const raw = execFileSync(process.execPath, ['-e', script, hostname], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error('dns.lookup did not produce any output');
    }
    const parsed = JSON.parse(trimmed) as Partial<DnsLookupResult>;
    if (!parsed.address) {
      throw new Error('dns.lookup result missing address');
    }
    return { address: parsed.address, family: parsed.family ?? 0 };
  } catch (err: any) {
    const stderr = err?.stderr ? String(err.stderr).trim() : '';
    const message = stderr ? `${stderr}` : err?.message || String(err);
    throw new Error(`Failed to resolve hostname "${hostname}" via dns.lookup: ${message}`);
  }
};

const poolConfig = (() => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL not set. Configure DATABASE_URL for your environment to connect to the database.'
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (err: any) {
    const message = err?.message || String(err);
    throw new Error(`DATABASE_URL is invalid: ${message}`);
  }

  const hostname = parsedUrl.hostname;
  if (!hostname) {
    throw new Error('DATABASE_URL is missing a hostname portion.');
  }

  const resolved = resolveHostname(hostname);
  // Only log hostname resolution when explicitly requested. Use `DB_LOG_QUERIES`
  // to enable query timing logs or `SHOW_DB_RESOLVE=true` to enable this message.
  if (process.env.DB_LOG_QUERIES === 'true' || process.env.SHOW_DB_RESOLVE === 'true') {
    console.info('[db] DATABASE_URL host resolved', {
      hostname,
      resolvedAddress: resolved.address,
      resolvedFamily: resolved.family,
    });
  }

  return {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
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
