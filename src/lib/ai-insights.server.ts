import { randomUUID } from 'crypto';
import pool from './db';
import type { AiInsight } from './types';

export type AiInsightInput = {
  title: string;
  summary?: string | null;
  action?: string | null;
  status?: string;
  source?: string | null;
};

const mapRow = (row: any): AiInsight => ({
  id: String(row.id),
  title: row.title || '',
  summary: row.summary ?? null,
  action: row.action ?? null,
  status: row.status || 'Pendente',
  source: row.source ?? null,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
});

export async function listAiInsights(): Promise<AiInsight[]> {
  const res = await pool.query(
    `SELECT id, title, summary, action, status, source, created_at, updated_at
     FROM ai_insights
     ORDER BY created_at DESC`
  );
  return res.rows.map(mapRow);
}

export async function createAiInsight(input: AiInsightInput): Promise<AiInsight> {
  const id = `ai-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO ai_insights (id, title, summary, action, status, source, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now(), now())
     RETURNING id, title, summary, action, status, source, created_at, updated_at`,
    [
      id,
      input.title,
      input.summary ?? null,
      input.action ?? null,
      input.status || 'Pendente',
      input.source ?? null,
    ]
  );
  return mapRow(res.rows[0]);
}

export async function updateAiInsight(id: string, input: Partial<AiInsightInput>): Promise<AiInsight | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  const push = (fragment: string, value?: any) => {
    sets.push(fragment.replace('??', `$${idx++}`));
    if (value !== undefined) params.push(value);
  };

  if (input.title !== undefined) push('title = ??', input.title);
  if (input.summary !== undefined) push('summary = ??', input.summary);
  if (input.action !== undefined) push('action = ??', input.action);
  if (input.status !== undefined) push('status = ??', input.status);
  if (input.source !== undefined) push('source = ??', input.source);

  if (!sets.length) return null;
  sets.push('updated_at = now()');

  params.push(id);
  const res = await pool.query(
    `UPDATE ai_insights SET ${sets.join(', ')} WHERE id = $${idx}
     RETURNING id, title, summary, action, status, source, created_at, updated_at`,
    params
  );
  if (!res.rows[0]) return null;
  return mapRow(res.rows[0]);
}

export async function deleteAiInsight(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM ai_insights WHERE id = $1', [id]);
  return res.rowCount > 0;
}
