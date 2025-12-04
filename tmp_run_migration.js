
const fs = require('fs');
const { Client } = require('pg');

const host = 'localhost';
const user = 'mapeamento_user';
const database = 'mapeamento';
const port = 5432;
const file = 'sql/002-create-api-keys-table.sql';
const password = 'admin';

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
