#!/usr/bin/env node
const { Client } = require('pg');

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

const host = parseArg('-h', '--host') || 'localhost';
const user = parseArg('-U', '--user') || 'postgres';
const database = parseArg('-d', '--db') || parseArg('-D','--database') || 'postgres';
const port = parseArg('-p', '--port') ? parseInt(parseArg('-p','--port'), 10) : 5432;
const password = process.env.PGPASSWORD || parseArg('--password');

if (!password) {
  console.error('ERRO: senha não fornecida. Defina a variável de ambiente PGPASSWORD ou passe --password.');
  console.error("Exemplo: $env:PGPASSWORD='admin'; node check_lancamentos_stats.js --host localhost --user postgres --db mydb");
  process.exit(1);
}

const client = new Client({ host, port, user, database, password });

async function run() {
  try {
    await client.connect();

    const q1 = 'SELECT count(*) AS total FROM public.lancamentos_mensais;';
    const r1 = await client.query(q1);
    console.log('\ncount: ' + (r1.rows[0] ? r1.rows[0].total : '0'));

    const q2 = `SELECT coalesce(min(data_lancamento)::text,'NULL') AS min_date, coalesce(max(data_lancamento)::text,'NULL') AS max_date FROM public.lancamentos_mensais;`;
    const r2 = await client.query(q2);
    console.log('min_max: ' + JSON.stringify(r2.rows[0]));

    const q3 = `SELECT id, data_lancamento::text AS data_lancamento, valor FROM public.lancamentos_mensais ORDER BY data_lancamento DESC LIMIT 5;`;
    const r3 = await client.query(q3);
    console.log('sample_rows:');
    if (r3.rows.length === 0) {
      console.log('  (no rows)');
    } else {
      r3.rows.forEach(r => console.log('  ' + JSON.stringify(r)));
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao executar queries:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(2);
  }
}

run();
