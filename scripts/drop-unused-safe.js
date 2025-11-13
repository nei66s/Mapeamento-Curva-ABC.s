#!/usr/bin/env node
// Safer variant: previews unused public tables, supports --execute to actually drop,
// creates an audit table and logs dropped tables. Always prints SQL and requires
// explicit --execute flag to perform destructive actions.
const { Client } = require('pg');
const WL = new Set(require('./table-whitelist'));

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

async function main() {
  const password = process.env.PGPASSWORD || parseArg('--password');
  if (!password) {
    console.error('ERRO: senha não fornecida. Defina PGPASSWORD ou passe --password');
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

  // Faster catalog-based query
  const res = await client.query(
    `SELECT n.nspname AS table_schema, c.relname AS table_name
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public' AND n.nspname <> 'audit'
     ORDER BY c.relname`
  );
  const unused = res.rows.filter(r => !WL.has(r.table_name));

  console.log('\nFound the following candidate unused tables (public):');
  if (unused.length === 0) console.log('  <none>\n');
  else unused.forEach(r => console.log(`  - ${r.table_name}`));

  // If nothing to do, exit
  if (unused.length === 0) {
    await client.end();
    return;
  }

  const execute = process.argv.includes('--execute');
  console.log('\nNOTE: This script is safe by default (dry-run). To actually drop tables, pass --execute');

  // Prepare audit table
  if (execute) {
    // Ensure audit schema exists and create audit table there.
    await client.query(`CREATE SCHEMA IF NOT EXISTS audit`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit.admin_dropped_tables (
        id bigserial primary key,
        table_schema text not null,
        table_name text not null,
        dropped_by text,
        dropped_at timestamptz default now(),
        sql text
      );
    `);
  }

  if (!execute) {
    console.log('\nDry-run SQL (preview):');
    unused.forEach(r => {
      console.log(`DROP TABLE IF EXISTS public."${r.table_name}" CASCADE;`);
    });
    console.log('\nNo changes made. Use --execute to apply.');
    await client.end();
    return;
  }

  console.log('\n-- Executing drops (BEGIN)');
  await client.query('BEGIN');
  try {
    for (const r of unused) {
      const sql = `DROP TABLE IF EXISTS public."${r.table_name}" CASCADE;`;
      console.log(sql);
      await client.query(sql);
      const who = process.env.USER || process.env.USERNAME || parseArg('--user') || 'script';
      // Use helper function for slightly better performance and centralization
      await client.query(`SELECT audit.log_dropped_table($1,$2,$3,$4)`, [r.table_schema, r.table_name, who, sql]);
    }
    await client.query('COMMIT');
    console.log('-- Done. Drops committed.');
  } catch (err) {
    console.error('Error during drops, rolling back:', err);
    await client.query('ROLLBACK');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
