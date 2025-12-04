const { Client } = require('pg');

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv.length > idx + 1) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  const id = parseArg('--id') || parseArg('--key');
  const val = parseArg('--value');
  if (!id || typeof val === 'undefined') {
    console.error('Usage: node scripts/set-module-beta.js --id <id> --value true|false');
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
    const res = await client.query('update modules set beta = $2, updated_at = now() where id = $1 returning id, key, name, beta', [id, val === 'true']);
    if (res.rowCount === 0) {
      console.log('not found');
    } else {
      console.log(JSON.stringify(res.rows[0], null, 2));
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error updating DB:', err && err.message ? err.message : err);
    try { await client.end(); } catch(_){}
    process.exit(1);
  }
}

main();
