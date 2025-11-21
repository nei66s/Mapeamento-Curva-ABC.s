import pool from './db';
import type { NotificationPayload, NotificationRecord, NotificationSeverity } from './types';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      module TEXT,
      title TEXT NOT NULL,
      message TEXT,
      severity TEXT NOT NULL DEFAULT 'info',
      related_id TEXT,
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ
    )
  `);
}

export async function getNotifications(userId: string, options?: { limit?: number; unreadOnly?: boolean }): Promise<NotificationRecord[]> {
  await ensureTable();
  const limit = options?.limit ?? 25;
  const unreadOnly = options?.unreadOnly;
  const params: any[] = [userId, limit];
  const conditions = ['user_id = $1'];
  if (unreadOnly) {
    conditions.push('read_at IS NULL');
  }
  const rows = await pool.query(
    `SELECT *
     FROM notifications
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $2`,
    params
  );
  return rows.rows.map((row: any) => ({
    id: Number(row.id),
    userId: String(row.user_id),
    module: row.module ?? null,
    title: String(row.title),
    message: row.message ?? null,
    severity: (row.severity as NotificationSeverity) ?? 'info',
    relatedId: row.related_id ?? null,
    meta: row.meta ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
  }));
}

export async function createNotification(userId: string, payload: NotificationPayload): Promise<NotificationRecord> {
  await ensureTable();
  const severity = payload.severity ?? 'info';
  const res = await pool.query(
    `INSERT INTO notifications (user_id, module, title, message, severity, related_id, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      userId,
      payload.module ?? null,
      payload.title,
      payload.message ?? null,
      severity,
      payload.relatedId ?? null,
      payload.meta ?? null,
    ]
  );
  const row = res.rows[0];
  return {
    id: Number(row.id),
    userId: String(row.user_id),
    module: row.module ?? null,
    title: String(row.title),
    message: row.message ?? null,
    severity: (row.severity as NotificationSeverity) ?? 'info',
    relatedId: row.related_id ?? null,
    meta: row.meta ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
  };
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  await ensureTable();
  await pool.query(
    `UPDATE notifications SET read_at = NOW() WHERE id = $1`,
    [notificationId]
  );
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await ensureTable();
  await pool.query(
    `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
}
