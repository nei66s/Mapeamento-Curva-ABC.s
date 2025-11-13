require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool();
  try {
    const resAll = await pool.query("SELECT id FROM vacation_requests ORDER BY start_date LIMIT 50");
    console.log('Existing ids:', resAll.rows.map(r=>r.id));

    const tried = ['2','vac-2','vac-002'];
    const resMatch = await pool.query('SELECT id FROM vacation_requests WHERE id = ANY($1::text[])', [tried]);
    console.log('Matches for', tried, ':', resMatch.rows.map(r=>r.id));
  } catch (err) {
    console.error('Error querying DB:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
