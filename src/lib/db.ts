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
  const databaseUrl = (process.env.DATABASE_URL || '').trim();
  const isProd = process.env.NODE_ENV === 'production';

  // IMPORTANT: never disable TLS certificate verification by default.
  // Allow an explicit override only for controlled environments.
  const rejectUnauthorizedEnv = (process.env.DB_SSL_REJECT_UNAUTHORIZED || '').trim().toLowerCase();
  const rejectUnauthorized = rejectUnauthorizedEnv
    ? rejectUnauthorizedEnv !== 'false' && rejectUnauthorizedEnv !== '0'
    : true;

  // Allow disabling SSL completely (not recommended) for local/test.
  const sslMode = (process.env.PGSSLMODE || '').trim().toLowerCase();
  const sslDisabled = sslMode === 'disable' || sslMode === 'disabled' || sslMode === 'off';
  const ssl = sslDisabled ? false : { rejectUnauthorized };

  if (isProd && sslDisabled) {
    throw new Error('Refusing to start with PGSSLMODE=disable in production.');
  }

  const pgHost = (process.env.PGHOST || '').trim();
  const pgPortRaw = (process.env.PGPORT || '').trim();
  const pgUser = (process.env.PGUSER || '').trim();
  const pgPassword = (process.env.PGPASSWORD || '').trim();
  const pgDatabase = (process.env.PGDATABASE || '').trim();
  const hasPgEnv = Boolean(pgHost || pgPortRaw || pgUser || pgPassword || pgDatabase);

  if (!databaseUrl && !hasPgEnv) {
    // In production, fail fast to avoid running without a DB.
    // In dev/test, allow importing modules that depend on `pool` without
    // immediately crashing the process; callers will fail on first query.
    if (isProd) {
      throw new Error(
        'Database configuration not set. Configure DATABASE_URL or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE to connect.'
      );
    }
    return null;
  }

  if (!databaseUrl) {
    // Allow configuring via PG* environment variables.
    const port = pgPortRaw ? Number(pgPortRaw) : undefined;
    if (pgPortRaw && (!Number.isFinite(port) || port! <= 0)) {
      throw new Error(`PGPORT is invalid: "${pgPortRaw}"`);
    }

    if (pgHost && (process.env.DB_LOG_QUERIES === 'true' || process.env.SHOW_DB_RESOLVE === 'true')) {
      try {
        const resolved = resolveHostname(pgHost);
        console.info('[db] PGHOST resolved', {
          hostname: pgHost,
          resolvedAddress: resolved.address,
          resolvedFamily: resolved.family,
        });
      } catch (e) {
        // ignore resolution failures; pg will still attempt to connect
      }
    }

    return {
      host: pgHost || undefined,
      port,
      user: pgUser || undefined,
      password: pgPassword || undefined,
      database: pgDatabase || undefined,
      ssl,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    };
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

  let resolved: DnsLookupResult | null = null;
  try {
    resolved = resolveHostname(hostname);
  } catch (e: any) {
    const message = e?.message || String(e);
    console.warn('[db] Could not resolve DATABASE_URL hostname', { hostname, error: message });
    // Continue without resolved address; `pg` will attempt to connect using the
    // original hostname. Avoid crashing the process on transient DNS issues.
  }

  // Only log hostname resolution when explicitly requested and when we have
  // a successful resolution result.
  if ((process.env.DB_LOG_QUERIES === 'true' || process.env.SHOW_DB_RESOLVE === 'true') && resolved) {
    console.info('[db] DATABASE_URL host resolved', {
      hostname,
      resolvedAddress: resolved.address,
      resolvedFamily: resolved.family,
    });
  }

  return {
    connectionString: databaseUrl,
    ssl,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  };
})();

const pool = (() => {
  if (!poolConfig) {
    // Minimal stub to keep unit tests and non-DB code paths working and to
    // avoid failing during Next's page-data collection in dev when no DB is
    // configured. Return safe empty results for queries and a connect() that
    // yields a no-op client.
    const makeWarn = () => console.warn('[db] Database not configured; returning safe stub.');
    return {
      async query() {
        makeWarn();
        return { rows: [], rowCount: 0 };
      },
      async connect() {
        makeWarn();
        return {
          query: async () => ({ rows: [], rowCount: 0 }),
          release: async () => {},
        } as any;
      },
      async end() {
        return;
      },
    } as any;
  }
  return new Pool(poolConfig as any);
})();

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
      // Avoid logging full error objects which may contain sensitive details.
      const safe = {
        message: (err as any)?.message || String(err),
        code: (err as any)?.code,
        severity: (err as any)?.severity,
      };
      console.error('[db] query error', { durationMs: dt, err: safe });
      throw err;
    }
  };
}

export default pool;
