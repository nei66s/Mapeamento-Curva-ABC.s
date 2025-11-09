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
const password = process.env.PGPASSWORD || parseArg('--password');

if (!password) {
  console.error('ERRO: senha não fornecida. Defina PGPASSWORD ou passe --password');
  process.exit(1);
}

const client = new Client({ host, port, user, database, password });
(async () => {
  try {
    await client.connect();
    const res = await client.query(`SELECT mes, saldo_mes FROM public.mv_saldo_mensal ORDER BY mes DESC;`);
    if (!res.rows || res.rows.length === 0) {
      console.log('Nenhuma linha encontrada em public.mv_saldo_mensal');
    } else {
      console.log('mv_saldo_mensal:');
      res.rows.forEach(r => console.log(`  ${r.mes.toISOString().slice(0,10)}  ${r.saldo_mes}`));
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao consultar mv_saldo_mensal:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(2);
  }
})();
