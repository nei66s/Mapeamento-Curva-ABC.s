const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set in environment');
    process.exit(2);
  }

  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query('SELECT 1 as ok');
    console.log('DB test query result:', res.rows);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connection/query error:', err && err.message ? err.message : err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
}

main();
