#!/usr/bin/env node
// Moves existing public.admin_dropped_tables into audit.admin_dropped_tables
// Usage: set env PGPASSWORD, PGUSER, PGDATABASE and run
const { Client } = require('pg');

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
  try {
    await client.query('BEGIN');
    await client.query('CREATE SCHEMA IF NOT EXISTS audit');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit.admin_dropped_tables (
        id bigserial primary key,
        table_schema text not null,
        table_name text not null,
        dropped_by text,
        dropped_at timestamptz default now(),
        sql text
      )
    `);

    // Copy rows if the public table exists
    const exists = await client.query("SELECT to_regclass('public.admin_dropped_tables') as reg");
    if (exists.rows[0].reg) {
      await client.query(`INSERT INTO audit.admin_dropped_tables (table_schema, table_name, dropped_by, dropped_at, sql)
        SELECT table_schema, table_name, dropped_by, dropped_at, sql FROM public.admin_dropped_tables`);
      await client.query('DROP TABLE public.admin_dropped_tables');
      console.log('Moved rows and dropped public.admin_dropped_tables');
    } else {
      console.log('No public.admin_dropped_tables found; nothing to move.');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error migrating audit table:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(e=>{console.error(e); process.exit(1)});
