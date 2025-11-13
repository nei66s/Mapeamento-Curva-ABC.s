import { randomUUID } from 'crypto';
import pool from './db';
import type { VacationRequest } from './types';

function mapRow(row: any): VacationRequest {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userName: row.user_name || row.name || '',
    userDepartment: row.user_department || row.department || undefined,
    status: row.status || 'Aprovado',
    startDate: new Date(row.start_date).toISOString(),
    endDate: new Date(row.end_date).toISOString(),
    requestedAt: row.requested_at ? new Date(row.requested_at).toISOString() : undefined,
    userAvatarUrl: row.avatarurl || row.avatar_url || undefined,
    totalDays: typeof row.total_days === 'number' ? row.total_days : null,
  };
}

export async function listVacationRequests(): Promise<VacationRequest[]> {
  const res = await pool.query(`SELECT * FROM vacation_requests ORDER BY start_date ASC`);
  const vacations = res.rows;

  // Gather user ids referenced and fetch their records in one query (safe: SELECT * avoids referencing unknown columns)
  const userIds = Array.from(new Set(vacations.map((v: any) => v.user_id).filter(Boolean)));
  let usersMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const uRes = await pool.query(`SELECT * FROM users WHERE id::text = ANY($1::text[])`, [userIds]);
    usersMap = uRes.rows.reduce((acc: Record<string, any>, row: any) => {
      acc[String(row.id)] = row;
      return acc;
    }, {});
  }

  return vacations.map((row: any) => {
    const merged = { ...row, ...(usersMap[String(row.user_id)] || {}) };
    return mapRow(merged);
  });
}

type VacationInput = {
  userId: string;
  startDate: string;
  endDate: string;
  status?: string;
  totalDays?: number | null;
};

export async function createVacationRequest(data: VacationInput): Promise<VacationRequest> {
  const id = `vac-${randomUUID()}`;
  const totalDays = data.totalDays ?? Math.max(0, Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const res = await pool.query(
    `INSERT INTO vacation_requests (id, user_id, user_department, status, start_date, end_date, requested_at, total_days)
     VALUES ($1,$2,$3,$4,$5,$6, now(), $7)
     RETURNING *`,
    [id, data.userId, (data as any).userDepartment || null, data.status || 'Aprovado', data.startDate, data.endDate, totalDays]
  );
  const row = res.rows[0];
  // fetch user record separately (safe: SELECT * avoids referencing unknown columns)
  let userRow: any = undefined;
  try {
    const uRes = await pool.query(`SELECT * FROM users WHERE id::text = $1 LIMIT 1`, [row.user_id]);
    userRow = uRes.rows[0];
  } catch (err) {
    // ignore; userRow stays undefined
  }

  const merged = { ...(row || {}), ...(userRow || {}) };
  return mapRow(merged);
}

export async function deleteVacationRequest(id: string): Promise<boolean> {
  const sanitized = String(id).trim().replace(/^"+|"+$/g, '');
  try {
    // Try direct delete first
    let res = await pool.query('DELETE FROM vacation_requests WHERE id = $1', [sanitized]);
    console.debug('deleteVacationRequest (direct)', { id: sanitized, rowCount: res.rowCount });
    if (res.rowCount > 0) return true;

    // If no rows deleted, try a fallback for numeric/simple ids that may be stored with a 'vac-' prefix.
    // Some seed data uses zero-padded ids like 'vac-001', while older clients may send '1' or '2'.
    if (!sanitized.startsWith('vac-')) {
      const prefixed = `vac-${sanitized}`;
      const isNumeric = /^[0-9]+$/.test(sanitized);
      // If sanitized is purely numeric, also try a common zero-padded variant (e.g. 'vac-001').
      if (isNumeric) {
        const zeroPadded = `vac-${sanitized.padStart(3, '0')}`;
        // New: try the numeric ID directly as well, without prefixing or padding.
        res = await pool.query('DELETE FROM vacation_requests WHERE id = $1 OR id = $2 OR id = $3 OR id = $4', [sanitized, prefixed, zeroPadded, sanitized]);
        console.debug('deleteVacationRequest (fallback)', { tried: [sanitized, prefixed, zeroPadded, sanitized], rowCount: res.rowCount });
      } else {
        res = await pool.query('DELETE FROM vacation_requests WHERE id = $1 OR id = $2', [sanitized, prefixed]);
        console.debug('deleteVacationRequest (fallback)', { tried: [sanitized, prefixed], rowCount: res.rowCount });
      }
      if (res.rowCount > 0) return true;
    }

    return false;
  } catch (err) {
    console.error('deleteVacationRequest error for id', sanitized, err);
    throw err;
  }
}

