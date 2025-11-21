import pool from './db';
import type { HistoryPayload, UserHistoryEntry } from './types';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_history (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      module TEXT,
      action TEXT,
      pathname TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function logUserHistory(userId: string, payload: HistoryPayload): Promise<UserHistoryEntry> {
  await ensureTable();
  const res = await pool.query(
    `INSERT INTO user_history (user_id, module, action, pathname, details)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [userId, payload.module ?? null, payload.action ?? null, payload.pathname, payload.details ?? null]
  );
  const row = res.rows[0];
  return {
    id: Number(row.id),
    userId: String(row.user_id),
    module: row.module ?? null,
    action: row.action ?? null,
    pathname: String(row.pathname),
    details: row.details ?? null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getUserHistory(userId: string, options?: { limit?: number }): Promise<UserHistoryEntry[]> {
  await ensureTable();
  const limit = options?.limit ?? 25;
  const res = await pool.query(
    `SELECT *
     FROM user_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return res.rows.map((row: any) => ({
    id: Number(row.id),
    userId: String(row.user_id),
    module: row.module ?? null,
    action: row.action ?? null,
    pathname: String(row.pathname),
    details: row.details ?? null,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
