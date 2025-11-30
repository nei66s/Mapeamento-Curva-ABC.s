import pool from '../src/lib/db';
import { issueAccessToken } from '../src/lib/auth/jwt';

async function main() {
  try {
    const res = await pool.query('select id, role from users where email = $1 limit 1', ['admin@gmail.com']);
    let row = res.rowCount ? res.rows[0] : null;
    if (!row) {
      const r2 = await pool.query("select id, role from users where role = $1 limit 1", ['admin']);
      row = r2.rowCount ? r2.rows[0] : null;
    }
    if (!row) {
      process.exitCode = 2;
      return;
    }
    const token = issueAccessToken(String(row.id), row.role || undefined);
    // print only the token for easy copy
    process.stdout.write(token);
  } catch (err) {
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

main();
