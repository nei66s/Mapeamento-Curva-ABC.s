#!/usr/bin/env node
const { Pool } = require('pg');
const argv = process.argv.slice(2);
if (argv.length === 0) {
  console.error('Usage: node scripts/check-avatar.js <userId>');
  process.exit(1);
}
const userId = argv[0];

function resolvePassword() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!process.env.PGPASSWORD) throw new Error('PGPASSWORD not set (production)');
    return process.env.PGPASSWORD;
  }
  if (!process.env.PGPASSWORD) {
    const allowDefault = String(process.env.DEV_ALLOW_DEFAULT_PG_PASSWORD || '').toLowerCase() === 'true';
    if (allowDefault) return 'admin';
    throw new Error('PGPASSWORD not set. Set PGPASSWORD or enable DEV_ALLOW_DEFAULT_PG_PASSWORD for dev.');
  }
  return process.env.PGPASSWORD;
}

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

async function main() {
  try {
    const res = await pool.query('SELECT id, avatar_url, avatar_mime, avatar_data IS NOT NULL AS has_data FROM users WHERE id = $1 LIMIT 1', [userId]);
    if (res.rowCount === 0) {
      console.log('User not found:', userId);
      process.exit(2);
    }
    const row = res.rows[0];
    console.log('User:', row.id);
    console.log('avatar_url:', row.avatar_url);
    console.log('avatar_mime:', row.avatar_mime);
    console.log('has_data:', row.has_data);
    process.exit(0);
  } catch (err) {
    console.error('Error checking avatar:', err);
    process.exit(3);
  } finally {
    try { await pool.end(); } catch(_) {}
  }
}

main();
