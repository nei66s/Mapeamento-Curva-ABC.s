// Lists public tables not in the application whitelist using node-postgres.
const { Client } = require('pg');

const WL = new Set([
  'users','categories','items','stores','store_items','suppliers',
  'incidents','warranty_items','impact_factors','contingency_plans','lead_times','placeholder_images',
  'technicians','tools','technical_reports','vacation_requests','unsalvageable_items','settlement_letters',
  'rncs','indicators','indicadores_lancamentos','lancamentos_mensais',
  'compliance_checklist_items','compliance_visits','store_compliance_data',
]);

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'admin',
    database: process.env.PGDATABASE || 'postgres',
  });
  await client.connect();
  const res = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
  );
  const unused = res.rows.map(r => r.table_name).filter(name => !WL.has(name));
  console.log('Unused tables (public):');
  if (unused.length === 0) console.log('  <none>');
  else unused.forEach(n => console.log('  -', n));
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });

