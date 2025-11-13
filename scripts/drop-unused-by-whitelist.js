// Drops public tables not in the application whitelist using node-postgres.
// DANGER: Destructive. Backup before running.
const { Client } = require('pg');

const WL = new Set([
  'users','categories','items','stores','store_items','suppliers',
  'incidents','warranty_items','impact_factors','contingency_plans','lead_times','placeholder_images',
  'technicians','tools','technical_reports','vacation_requests','unsalvageable_items','settlement_letters',
  'rncs','indicators','indicadores_lancamentos','lancamentos_mensais',
  'compliance_checklist_items','compliance_visits','store_compliance_data',
]);

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
  if (unused.length === 0) {
    console.log('No unused public tables to drop.');
    await client.end();
    return;
  }
  console.log('Dropping tables:', unused.join(', '));
  await client.query('BEGIN');
  for (const name of unused) {
    const sql = `DROP TABLE IF EXISTS public."${name}" CASCADE;`;
    console.log(sql);
    await client.query(sql);
  }
  await client.query('COMMIT');
  console.log('Done.');
  await client.end();
}

main().catch(async err => { console.error(err); process.exit(1); });

