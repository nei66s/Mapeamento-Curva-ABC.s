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
