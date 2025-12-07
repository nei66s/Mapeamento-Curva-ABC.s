import { randomUUID } from 'crypto';
import pool from './db';

export type AccountRequest = {
  id: string;
  name: string;
  email: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: string;
};

function mapRow(row: any): AccountRequest {
  return {
    id: String(row.id),
    name: row.name || '',
    email: row.email || '',
    message: row.message || '',
    status: row.status || 'pending',
    requestedAt: row.requested_at ? new Date(row.requested_at).toISOString() : undefined,
  };
}

export async function listAccountRequests(): Promise<AccountRequest[]> {
  const res = await pool.query(`SELECT * FROM account_requests ORDER BY requested_at DESC`);
  return res.rows.map(mapRow);
}

export async function createAccountRequest(data: { name: string; email: string; message?: string }): Promise<AccountRequest> {
  const id = `ar-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO account_requests (id, name, email, message, status, requested_at) VALUES ($1,$2,$3,$4,'pending', now()) RETURNING *`,
    [id, data.name, data.email, data.message || null]
  );
  return mapRow(res.rows[0]);
}

export async function setAccountRequestStatus(id: string, status: 'approved' | 'rejected') {
  const sanitized = String(id).trim();
  const res = await pool.query(`UPDATE account_requests SET status = $1 WHERE id = $2 RETURNING *`, [status, sanitized]);
  if (!res.rows[0]) return null;
  return mapRow(res.rows[0]);
}

export async function deleteAccountRequest(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM account_requests WHERE id = $1', [String(id).trim()]);
  return res.rowCount > 0;
}
