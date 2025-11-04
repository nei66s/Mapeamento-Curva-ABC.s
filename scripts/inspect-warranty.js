const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'admin',
  database: process.env.PGDATABASE || 'postgres',
});

(async () => {
  try {
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='warranty_items'");
    console.log('columns:', cols.rows.map(r=>r.column_name));
    const sample = await pool.query('SELECT * FROM warranty_items ORDER BY id DESC LIMIT 10');
    console.log('rows:', sample.rows);
  } catch (err) {
    console.error('inspect error', err);
  } finally {
    await pool.end();
  }
})();
