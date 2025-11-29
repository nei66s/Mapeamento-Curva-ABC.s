import { buildAdminSession } from '../server/adapters/session-adapter';
import pool from './db';

async function run() {
  try {
    // Timed: list admin user by email to get id
    const res = await pool.query('select id, email, role from users where email = $1 limit 1', ['admin@gmail.com']);
    if (!res.rows[0]) {
      console.log('admin user not found');
      await pool.end();
      return;
    }
    const id = res.rows[0].id;
    console.log('Found admin id:', id, 'role:', res.rows[0].role);
    const session = await buildAdminSession(id);
    console.log('buildAdminSession result:', JSON.stringify(session, null, 2));
  } catch (err) {
    console.error('Error calling buildAdminSession:', err);
  } finally {
    await pool.end();
  }
}

run();
