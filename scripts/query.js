const { Client } = require('pg');
const sql = process.argv[2] || "SELECT table_name FROM information_schema.tables WHERE table_name ILIKE 'audit%';";
const db = process.argv[3] || 'mydb';

(async () => {
  const client = new Client({ host: 'localhost', user: 'postgres', database: db, password: process.env.PGPASSWORD || 'admin' });
  try {
    await client.connect();
    const res = await client.query(sql);
    console.log('DB:', db, 'rows:', res.rows.length);
    console.dir(res.rows, { depth: null });
    await client.end();
  } catch (e) {
    console.error('ERR', e.message || e);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
