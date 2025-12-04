#!/usr/bin/env node
// Node fallback for check-admin-user: runs queries and calls /api/users
// Usage: node scripts/check-admin-user-node.js --host localhost --port 5432 --user postgres --db your_db --password your_pw --apiPort 9002 [--upsert]

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fetch = global.fetch || require('node-fetch');

function parseArgs() {
  const args = require('minimist')(process.argv.slice(2));
  return {
    host: args.host || args.DbHost || process.env.DBHOST || 'localhost',
    port: args.port || args.DbPort || process.env.DBPORT || 5432,
    user: args.user || args.DbUser || process.env.DBUSER || 'postgres',
    database: args.db || args.DbName || process.env.DBNAME || process.env.PGDATABASE || 'your_db',
    password: args.password || args.DbPassword || process.env.DBPASSWORD || process.env.PGPASSWORD || 'admin',
    apiPort: args.apiPort || args.ApiPort || process.env.APIPORT || 9002,
    upsert: Boolean(args.upsert || args.UpsertAdmin || args.upsertadmin)
  };
}

async function main() {
  const cfg = parseArgs();
  const cstring = `postgresql://${cfg.user}:${encodeURIComponent(cfg.password)}@${cfg.host}:${cfg.port}/${cfg.database}`;
  const client = new Client({ connectionString: cstring });
  try {
    await client.connect();
  } catch (e) {
    console.error('Failed to connect to Postgres:', e.message || e);
    process.exit(2);
  }

  const queries = [
    { name: 'tables', q: "SELECT to_regclass('public.users') AS users_table, to_regclass('public.roles') AS roles_table, to_regclass('public.user_roles') AS user_roles_table, to_regclass('public.user_profile') AS user_profile_table;" },
    { name: 'count', q: 'SELECT count(*) AS user_count FROM users;' },
    { name: 'sample', q: 'SELECT id, name, email, role, created_at, status FROM users ORDER BY created_at DESC LIMIT 50;' },
    { name: 'admin_search', q: "SELECT id, name, email, role, created_at FROM users WHERE email ILIKE '%admin%' OR role ILIKE 'admin';" },
    { name: 'roles', q: 'SELECT id, name FROM roles ORDER BY id;' },
    { name: 'mapping', q: "SELECT u.id AS user_id, u.email, ur.role_id, r.name AS role_name FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id::text LEFT JOIN roles r ON r.id::text = ur.role_id WHERE u.email ILIKE '%admin%' OR r.name ILIKE 'admin';" },
    { name: 'user_profile_reg', q: "SELECT to_regclass('public.user_profile') AS user_profile_reg;" },
    { name: 'user_profile_sample', q: 'SELECT up.user_id, up.extra FROM user_profile up LIMIT 20;' }
  ];

  const out = { meta: { connectionString: cstring }, results: {} };
  for (const q of queries) {
    try {
      const res = await client.query(q.q);
      out.results[q.name] = res.rows;
      console.log(`[SQL:${q.name}] rows=${res.rowCount}`);
    } catch (e) {
      out.results[q.name] = { error: String(e.message || e) };
      console.warn(`[SQL:${q.name}] failed:`, e.message || e);
    }
  }

  // Call API
  const apiUrl = `http://localhost:${cfg.apiPort}/api/users`;
  try {
    console.log(`Calling API ${apiUrl}`);
    const res = await fetch(apiUrl);
    const json = await res.json();
    out.api = { status: res.status, body: json };
    console.log('[API] status=', res.status, 'items=', Array.isArray(json) ? json.length : 'n/a');
  } catch (e) {
    out.api = { error: String(e.message || e) };
    console.warn('[API] call failed', e.message || e);
  }

  if (cfg.upsert) {
    console.log('Running admin upsert (direct SQL) ...');
    try {
      const email = 'admin@gmail.com';
      const name = 'Admin';
      const role = 'admin';
      const password = 'admin';
      const hashed = await bcrypt.hash(password, 10);
      const uq = `INSERT INTO users (name, email, role, password_hash, created_at) VALUES ($1,$2,$3,$4, now()) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash RETURNING id, email, role`;
      const r = await client.query(uq, [name, email, role, hashed]);
      out.upsert = r.rows[0];
      console.log('Upsert result:', r.rows[0]);
    } catch (e) {
      out.upsert = { error: String(e.message || e) };
      console.warn('Upsert failed:', e.message || e);
    }
  }

  // write file
  const fs = require('fs');
  try {
    if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
    fs.writeFileSync('tmp/admin-check-output.json', JSON.stringify(out, null, 2));
    console.log('Wrote tmp/admin-check-output.json');
  } catch (e) {
    console.warn('Failed to write tmp file', e.message || e);
  }

  await client.end();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
