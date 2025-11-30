import pool from '../src/lib/db';
import { issueAccessToken } from '../src/lib/auth/jwt';

async function main() {
  try {
    // Try to find a user with email admin@gmail.com first, fallback to first user with role 'admin'
    let res = await pool.query('select id, email, role from users where email = $1 limit 1', ['admin@gmail.com']);
    if (res.rowCount === 0) {
      res = await pool.query("select id, email, role from users where role = $1 limit 1", ['admin']);
    }
    if (res.rowCount === 0) {
      console.error('No admin user found. Create a user with role=admin or email=admin@gmail.com');
      process.exitCode = 2;
      return;
    }
    const user = res.rows[0];
    const token = issueAccessToken(String(user.id), user.role || undefined);
    console.log('Found user:', user.email, 'id:', user.id);
    console.log('Access token (use in Authorization: Bearer <token>):');
    console.log(token);
  } catch (err) {
    console.error('make-admin-token error:', err && (err as any).message ? (err as any).message : err);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
  }
}

main();
