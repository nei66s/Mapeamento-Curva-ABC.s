#!/usr/bin/env node
const fs = require('fs');
const { Pool } = require('pg');

const file = process.argv[2] || 'stores-update-latlng.sql';
if (!fs.existsSync(file)) {
  console.error('SQL file not found:', file);
  process.exit(1);
}

const sql = fs.readFileSync(file, 'utf8');

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DEV_PG_PASSWORD || null,
      database: process.env.PGDATABASE || 'postgres',
    };

const pool = new Pool(poolConfig);

(async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to DB, executing SQL file:', file);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('SQL executed successfully.');
  } catch (err) {
    console.error('Error executing SQL:', err.message || err);
    try { await client.query('ROLLBACK'); } catch(e){}
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end();
  }
})();
