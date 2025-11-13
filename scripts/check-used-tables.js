#!/usr/bin/env node
const { Client } = require('pg');

const WL = new Set(require('./table-whitelist'));

async function main() {
  const password = process.env.PGPASSWORD;
  if (!password) {
    console.error('Set PGPASSWORD in env to connect');
    process.exit(1);
  }
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER || 'postgres',
    password,
    database: process.env.PGDATABASE || 'postgres',
  });
  await client.connect();
  const res = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_schema <> 'audit' ORDER BY table_name");
  const total = res.rows.length;
  const used = [];
  const unused = [];
  for (const r of res.rows) {
    if (WL.has(r.table_name)) used.push(r.table_name);
    else unused.push(r.table_name);
  }
  console.log('Total public tables:', total);
  console.log('In whitelist (used) count:', used.length);
  console.log(used.join('\n') || '<none>');
  console.log('\nNot in whitelist (candidates unused) count:', unused.length);
  console.log(unused.join('\n') || '<none>');
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
