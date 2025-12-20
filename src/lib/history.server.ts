import pool from './db';
import { moduleDefinitions } from './permissions-config';
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

export type ModuleActivitySummary = {
  modules: {
    id: string;
    label: string;
    count: number;
  }[];
  total: number;
  sinceDays?: number;
};

export async function getModuleActivitySummary(options?: { sinceDays?: number }): Promise<ModuleActivitySummary> {
  await ensureTable();
  const args: any[] = [];
  let whereClause = '';
  if (typeof options?.sinceDays === 'number' && options.sinceDays > 0) {
    args.push(new Date(Date.now() - options.sinceDays * 86400000));
    whereClause = 'WHERE created_at >= $1';
  }
  const res = await pool.query(
    `SELECT module, COUNT(*) AS total
     FROM user_history
     ${whereClause}
     GROUP BY module`,
    args
  );
  const counts = res.rows.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.module ?? '').trim();
    if (!key) return acc;
    acc[key] = Number(row.total ?? 0);
    return acc;
  }, {});

  const total = res.rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const modules = moduleDefinitions.map((module) => ({
    id: module.id,
    label: module.label,
    count: counts[module.id] ?? 0,
  }));
  return { modules, total, sinceDays: options?.sinceDays };
}
