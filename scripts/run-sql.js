#!/usr/bin/env node
// Run a SQL file against DATABASE_URL. Loads .env automatically.
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/run-sql.js <path-to-sql-file>');
    process.exit(2);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error('SQL file not found:', filePath);
    process.exit(3);
  }

  const sql = fs.readFileSync(filePath, { encoding: 'utf8' });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set in environment or .env');
    process.exit(4);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB. Executing:', filePath);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('SQL executed successfully.');
    process.exit(0);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // ignore
    }
    console.error('Error executing SQL:', err.message || err);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // ignore
    }
  }
}

main();
