// Lists public tables not in the application whitelist using node-postgres.
const { Client } = require('pg');

const WL = new Set(require('./table-whitelist'));

async function main() {
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
  await client.connect();
  const res = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_schema <> 'audit' ORDER BY table_name`
  );
  const unused = res.rows.map(r => r.table_name).filter(name => !WL.has(name));
  console.log('Unused tables (public):');
  if (unused.length === 0) console.log('  <none>');
  else unused.forEach(n => console.log('  -', n));
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });

