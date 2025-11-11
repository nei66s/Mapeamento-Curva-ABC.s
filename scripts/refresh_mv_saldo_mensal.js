#!/usr/bin/env node
const { Client } = require('pg');

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

const host = parseArg('-h','--host') || 'localhost';
const user = parseArg('-U','--user') || 'postgres';
const database = parseArg('-d','--db') || 'mydb';
const port = parseArg('-p','--port') ? parseInt(parseArg('-p','--port'),10) : 5432;
// Detect flag presence for --concurrently or -c
const concurrently = process.argv.includes('--concurrently') || process.argv.includes('-c');
const password = process.env.PGPASSWORD || parseArg('--password');

if (!password) {
  console.error('ERRO: senha não fornecida. Defina PGPASSWORD ou passe --password');
  process.exit(1);
}

const client = new Client({ host, port, user, database, password });
(async () => {
  try {
    await client.connect();
    console.log('Conectado a', database);
    const stmt = concurrently
      ? 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_saldo_mensal;'
      : 'REFRESH MATERIALIZED VIEW public.mv_saldo_mensal;';
    console.log('Executando:', stmt);
    // Note: CONCURRENTLY cannot be run inside a transaction block; pg Client runs single statements fine.
    await client.query(stmt);
    console.log('Refresh concluído.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao refresh materialized view:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(2);
  }
})();
