import { randomUUID } from 'crypto';
import pool from './db';
import type { ActionBoardItem } from './types';

export type ActionBoardInput = {
  title: string;
  owner: string;
  dueDate?: string | null;
  status?: string;
  progress?: number;
  details?: string | null;
};

const mapRow = (row: any): ActionBoardItem => ({
  id: String(row.id),
  title: row.title || '',
  owner: row.owner || '',
  dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
  status: row.status || 'Pendente',
  progress: Number.parseInt(String(row.progress ?? 0), 10) || 0,
  details: row.details ?? null,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
});

export async function listActionBoardItems(): Promise<ActionBoardItem[]> {
  const res = await pool.query(
    `SELECT id, title, owner, due_date, status, progress, details, created_at, updated_at
     FROM action_board
     ORDER BY due_date NULLS LAST, created_at DESC`
  );
  return res.rows.map(mapRow);
}

export async function createActionBoardItem(input: ActionBoardInput): Promise<ActionBoardItem> {
  const id = `ab-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO action_board (id, title, owner, due_date, status, progress, details, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     RETURNING id, title, owner, due_date, status, progress, details, created_at, updated_at`,
    [
      id,
      input.title,
      input.owner,
      input.dueDate ? new Date(input.dueDate) : null,
      input.status || 'Pendente',
      typeof input.progress === 'number' ? input.progress : 0,
      input.details ?? null,
    ]
  );
  return mapRow(res.rows[0]);
}

export async function updateActionBoardItem(id: string, input: Partial<ActionBoardInput>): Promise<ActionBoardItem | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  const push = (fragment: string, value?: any) => {
    sets.push(fragment.replace('??', `$${idx++}`));
    if (value !== undefined) params.push(value);
  };

  if (input.title !== undefined) push('title = ??', input.title);
  if (input.owner !== undefined) push('owner = ??', input.owner);
  if (input.dueDate !== undefined) push('due_date = ??', input.dueDate ? new Date(input.dueDate) : null);
  if (input.status !== undefined) push('status = ??', input.status);
  if (input.progress !== undefined) push('progress = ??', input.progress);
  if (input.details !== undefined) push('details = ??', input.details);

  if (!sets.length) return null;
  sets.push('updated_at = now()');

  params.push(id);
  const res = await pool.query(
    `UPDATE action_board SET ${sets.join(', ')} WHERE id = $${idx}
     RETURNING id, title, owner, due_date, status, progress, details, created_at, updated_at`,
    params
  );
  if (!res.rows[0]) return null;
  return mapRow(res.rows[0]);
}

export async function deleteActionBoardItem(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM action_board WHERE id = $1', [id]);
  return res.rowCount > 0;
}
