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
const port = parseArg('-p','--port') ? parseInt(parseArg('-p','--port'),10) : 5432;
const password = process.env.PGPASSWORD || parseArg('--password');
const newDb = parseArg('--newdb') || parseArg('-n') || 'mydb';
const database = 'postgres';

if (!password) {
  console.error('ERRO: Defina a senha via PGPASSWORD ou --password');
  process.exit(1);
}

const client = new Client({ host, port, user, database, password });
(async () => {
  try {
    await client.connect();
    await client.query(`CREATE DATABASE "${newDb}";`);
    console.log(`Database created: ${newDb}`);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar DB:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(2);
  }
})();
