const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.resolve(__dirname, 'seed-settlements.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('seed-settlements.sql file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'admin',
    database: process.env.PGDATABASE || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to Postgres:', `${client.host}:${client.port}/${client.database}`);
    await client.query(sql);
    console.log('Settlements seed executed successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to run settlements seed SQL:', err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

main();
