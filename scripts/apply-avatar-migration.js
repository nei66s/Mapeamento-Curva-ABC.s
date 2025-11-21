#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function resolvePassword() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!process.env.PGPASSWORD) {
      throw new Error('PGPASSWORD environment variable is not set (production).');
    }
    return process.env.PGPASSWORD;
  }

  if (!process.env.PGPASSWORD) {
    const allowDefault = String(process.env.DEV_ALLOW_DEFAULT_PG_PASSWORD || '').toLowerCase() === 'true';
    if (allowDefault) {
      console.warn("DEV_ALLOW_DEFAULT_PG_PASSWORD=true — using 'admin' fallback for development only.");
      return 'admin';
    }
    throw new Error('PGPASSWORD not set. Set PGPASSWORD or set DEV_ALLOW_DEFAULT_PG_PASSWORD=true for a development fallback.');
  }
  return process.env.PGPASSWORD;
}

async function main() {
  const sqlPath = path.join(__dirname, '..', 'sql', '001-add-avatar-bytea.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: resolvePassword(),
        database: process.env.PGDATABASE || 'postgres',
      };

  const pool = new Pool(poolConfig);
  try {
    console.log('Applying migration from', sqlPath);
    await pool.query(sql);
    console.log('Migration applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  } finally {
    try { await pool.end(); } catch(_) {}
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(3);
});
