import pool from '../src/lib/db';

async function main() {
  try {
    const res = await pool.query('SELECT count(*) as cnt FROM incidents');
    console.log('incidents count:', res.rows[0].cnt);

    const sample = await pool.query('SELECT id, item_name, location, status, opened_at FROM incidents ORDER BY opened_at DESC LIMIT 5');
    console.log('sample rows:', sample.rows);
  } catch (err) {
    console.error('query error', err && (err as any).message ? (err as any).message : err);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch {};
  }
}

main();
