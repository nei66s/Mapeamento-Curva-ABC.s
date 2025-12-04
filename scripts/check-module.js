const { Client } = require('pg');

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv.length > idx + 1) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  const idOrKey = parseArg('--id') || parseArg('--key');
  if (!idOrKey) {
    console.error('Usage: node scripts/check-module.js --id <id>  OR --key <key>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
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
    let res;
    if (process.argv.includes('--id')) {
      res = await client.query('select id, key, name, description, is_active, is_visible, beta from modules where id = $1 limit 1', [idOrKey]);
    } else {
      res = await client.query('select id, key, name, description, is_active, is_visible, beta from modules where key = $1 limit 1', [idOrKey]);
    }
    if (res.rowCount === 0) {
      console.log('not found');
    } else {
      console.log(JSON.stringify(res.rows[0], null, 2));
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err && err.message ? err.message : err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
}

main();
