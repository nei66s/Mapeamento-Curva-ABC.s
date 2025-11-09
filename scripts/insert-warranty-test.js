const { Pool } = require('pg');

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

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password,
  database: process.env.PGDATABASE || 'postgres',
});

(async () => {
  try {
    const res = await pool.query("INSERT INTO warranty_items (name, supplier_id, warranty_end) VALUES ($1,$2,$3) RETURNING *", ['UI test ' + Date.now(), 1, new Date().toISOString()]);
    console.log('inserted:', res.rows[0]);
    const rows = await pool.query('SELECT * FROM warranty_items ORDER BY id DESC LIMIT 5');
    console.log('rows:', rows.rows);
  } catch (err) {
    console.error('insert error', err);
  } finally {
    await pool.end();
  }
})();
