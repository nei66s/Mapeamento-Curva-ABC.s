import pool from '@/lib/db';

export async function saveRefreshToken(userId: string, token: string, expiresAt: string) {
  const res = await pool.query('insert into refresh_tokens(user_id, token, expires_at, created_at) values ($1,$2,$3, now()) returning id, user_id, token, expires_at, created_at', [userId, token, expiresAt]);
  return res.rows[0];
}

export async function validateRefreshToken(token: string) {
  const res = await pool.query('select id, user_id, token, expires_at from refresh_tokens where token = $1 limit 1', [token]);
  const row = res.rows[0];
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
  return row;
}

export async function invalidateRefreshToken(token: string) {
  await pool.query('delete from refresh_tokens where token = $1', [token]);
  return true;
}
