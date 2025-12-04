const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

async function main() {
  const dbUrlArg = parseArg('--database-url', '--db-url');
  const databaseUrl = dbUrlArg || process.env.DATABASE_URL;
  const clientConfig = databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'postgres',
      };

  const client = new Client(clientConfig);
  try {
    await client.connect();
    console.log('Connected to DB:', databaseUrl ? databaseUrl : `${client.host}:${client.port}/${client.database}`);

    const modulesRes = await client.query('select key, name, is_active, is_visible, beta from modules order by key limit 50');
    const flagsRes = await client.query('select key, label, enabled, module_id from feature_flags order by key limit 50');

    console.log('\n-- modules --');
    modulesRes.rows.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n-- feature_flags --');
    flagsRes.rows.forEach(r => console.log(JSON.stringify(r)));

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

main();
