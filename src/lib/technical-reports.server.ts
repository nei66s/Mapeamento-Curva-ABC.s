import { randomUUID } from 'crypto';
import pool from './db';
import type { TechnicalReport } from './types';

function mapReport(row: any): TechnicalReport {
  return {
    id: String(row.id),
    title: row.title || '',
    incidentId: row.incident_id || undefined,
    technicianId: row.technician_id || '',
    details: row.details || {},
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    status: (row.status || 'Pendente') as TechnicalReport['status'],
  };
}

export async function listTechnicalReports(): Promise<TechnicalReport[]> {
  const res = await pool.query('SELECT * FROM technical_reports ORDER BY created_at DESC');
  return res.rows.map(mapReport);
}

export async function getTechnicalReport(id: string): Promise<TechnicalReport | null> {
  const res = await pool.query('SELECT * FROM technical_reports WHERE id = $1 LIMIT 1', [id]);
  if (res.rowCount === 0) return null;
  return mapReport(res.rows[0]);
}

type ReportInput = Omit<TechnicalReport, 'id' | 'createdAt'> & { id?: string; createdAt?: string };

export async function createTechnicalReport(data: ReportInput): Promise<TechnicalReport> {
  const id = data.id ?? `LTD-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO technical_reports (id, title, technician_id, incident_id, details, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, now()))
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       technician_id = EXCLUDED.technician_id,
       incident_id = EXCLUDED.incident_id,
       details = EXCLUDED.details,
       status = EXCLUDED.status,
       created_at = EXCLUDED.created_at
     RETURNING *`,
    [
      id,
      data.title,
      data.technicianId,
      data.incidentId || null,
      JSON.stringify(data.details ?? {}),
      data.status || 'Pendente',
      data.createdAt ?? null,
    ]
  );
  return mapReport(res.rows[0]);
}

export async function updateTechnicalReport(
  id: string,
  data: Partial<Omit<TechnicalReport, 'id' | 'createdAt'>>
): Promise<TechnicalReport | null> {
  const parts: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const push = (field: string, value: any) => {
    parts.push(`${field} = $${idx++}`);
    values.push(value);
  };

  if (data.title !== undefined) push('title', data.title);
  if (data.technicianId !== undefined) push('technician_id', data.technicianId);
  if (data.incidentId !== undefined) push('incident_id', data.incidentId || null);
  if (data.details !== undefined) push('details', JSON.stringify(data.details));
  if (data.status !== undefined) push('status', data.status);

  if (!parts.length) return getTechnicalReport(id);

  values.push(id);
  const res = await pool.query(
    `UPDATE technical_reports SET ${parts.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (res.rowCount === 0) return null;
  return mapReport(res.rows[0]);
}

export async function deleteTechnicalReport(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM technical_reports WHERE id = $1', [id]);
  return res.rowCount > 0;
}
