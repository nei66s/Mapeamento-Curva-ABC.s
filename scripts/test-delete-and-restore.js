require('dotenv').config();
const { Pool } = require('pg');

async function test(id) {
  const pool = new Pool();
  try {
    const sanitized = String(id).trim().replace(/^"+|"+$/g, '');
    console.log('Testing delete for id:', sanitized);

    // find matching row(s)
    const findRes = await pool.query('SELECT * FROM vacation_requests WHERE id = $1 OR id = $2 OR id = $3', [sanitized, `vac-${sanitized}`, `vac-${sanitized.padStart(3,'0')}`]);
    console.log('Found rows before delete:', findRes.rows.length ? findRes.rows.map(r=>r.id) : []);
    if (findRes.rows.length === 0) {
      console.log('No matching rows to delete. Exiting.');
      return;
    }

    // save rows to restore later
    const saved = findRes.rows;

    // attempt delete with same logic
    const deleteRes = await pool.query('DELETE FROM vacation_requests WHERE id = $1 OR id = $2 OR id = $3 RETURNING *', [sanitized, `vac-${sanitized}`, `vac-${sanitized.padStart(3,'0')}`]);
    console.log('Delete rowCount:', deleteRes.rowCount, 'deleted ids:', deleteRes.rows.map(r=>r.id));

    // restore deleted rows (if any)
    if (deleteRes.rowCount > 0) {
      for (const row of saved) {
        const insertSql = `INSERT INTO vacation_requests (id, user_id, user_department, status, start_date, end_date, requested_at, total_days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`;
        await pool.query(insertSql, [row.id, row.user_id, row.user_department, row.status, row.start_date, row.end_date, row.requested_at, row.total_days]);
      }
      console.log('Restored deleted rows.');
    }
  } catch (err) {
    console.error('Error in test:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

const arg = process.argv[2] || '2';
test(arg);
