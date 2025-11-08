#!/usr/bin/env node
const fs = require('fs');
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
const database = parseArg('-d','--db') || parseArg('--database') || 'mydb';
const port = parseArg('-p','--port') ? parseInt(parseArg('-p','--port'),10) : 5432;
const file = parseArg('-f','--file') || '../sql/lancamentos_ddl_fixed.sql';
const password = process.env.PGPASSWORD || parseArg('--password');

if (!password) {
  console.error('ERRO: senha não fornecida. Defina PGPASSWORD ou passe --password');
  console.error("Ex: $env:PGPASSWORD='admin'; node apply_sql.js --host localhost --user postgres --db mydb --file ../sql/lancamentos_ddl_fixed.sql");
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error('Arquivo SQL não encontrado:', file);
  process.exit(2);
}

const sql = fs.readFileSync(file, 'utf8');
const client = new Client({ host, port, user, database, password });

(async () => {
  try {
    await client.connect();
    console.log('Conectado a', database);
    console.log('Executando SQL de', file);
    // Execute the whole file in one call to preserve dollar-quoted strings and DO blocks.
    await client.query(sql);
    console.log('SQL executado com sucesso.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Erro ao aplicar SQL:', err.message || err);
    try { await client.query('ROLLBACK'); } catch(e){}
    try { await client.end(); } catch(e){}
    process.exit(3);
  }
})();
