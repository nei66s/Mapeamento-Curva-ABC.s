const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.resolve(__dirname, '..', 'seed.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('seed.sql file not found:', sqlPath);
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

    // Execute statements one by one to provide better error reporting
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
      } catch (err) {
        console.error('Error executing SQL statement index', i);
        console.error('--- STATEMENT START ---');
        console.error(stmt.slice(0, 2000));
        console.error('--- STATEMENT END ---');
        throw err;
      }
    }

    console.log('Seed SQL executed successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to run seed SQL:', err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

main();
