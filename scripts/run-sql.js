const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.resolve(__dirname, 'create-compliance-tables.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  function parseArg(nameShort, nameLong) {
    const idxShort = process.argv.indexOf(nameShort);
    if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
    const idxLong = process.argv.indexOf(nameLong);
    if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
    return undefined;
  }

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

  try {
    await client.connect();
    console.log('Connected to Postgres:', `${client.host}:${client.port}/${client.database}`);
    await client.query(sql);
    console.log('SQL executed successfully. Tables created (if not existed).');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to run SQL:', err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

main();
