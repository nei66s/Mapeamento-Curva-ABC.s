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
  const res = await pool.query(
    `SELECT vr.*, u.name, u.avatarUrl, u.department
       FROM vacation_requests vr
       LEFT JOIN users u ON u.id::text = vr.user_id
     ORDER BY vr.start_date ASC`
  );
  return res.rows.map(mapRow);
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
    `INSERT INTO vacation_requests (id, user_id, status, start_date, end_date, requested_at, total_days)
     VALUES ($1,$2,$3,$4,$5, now(), $6)
     RETURNING *`,
    [id, data.userId, data.status || 'Aprovado', data.startDate, data.endDate, totalDays]
  );
  const row = res.rows[0];
  // hydrate with joined data
  const enriched = await pool.query(
    `SELECT vr.*, u.name, u.avatarUrl, u.department
       FROM vacation_requests vr
       LEFT JOIN users u ON u.id::text = vr.user_id
      WHERE vr.id = $1`,
    [row.id]
  );
  return mapRow(enriched.rows[0] || row);
}

export async function deleteVacationRequest(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM vacation_requests WHERE id = $1', [id]);
  return res.rowCount > 0;
}

