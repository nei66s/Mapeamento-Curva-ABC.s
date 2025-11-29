import pool from './db';
import bcrypt from 'bcryptjs';

async function run() {
  const email = 'admin@gmail.com';
  const name = 'Admin';
  const role = 'admin';
  const password = 'admin';

  const hashed = await bcrypt.hash(password, 10);

  const q = `
    INSERT INTO users (name, email, role, password_hash, created_at)
    VALUES ($1, $2, $3, $4, now())
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      password_hash = EXCLUDED.password_hash
    RETURNING id, email, role;
  `;

  const res = await pool.query(q, [name, email, role, hashed]);
  console.log('Admin upsert result:', res.rows[0]);
  await pool.end();
}

run().catch((err) => {
  console.error('Error setting admin user:', err);
  process.exit(1);
});
