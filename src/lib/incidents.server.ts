import { randomUUID } from 'crypto';
import { Incident } from './types';
import pool from './db';

function mapIncident(row: any): Incident {
  return {
    id: String(row.id),
    itemName: row.itemname || row.item_name || '',
    location: row.location || '',
    status: (row.status || 'Aberto') as Incident['status'],
    openedAt: row.opened_at ? new Date(row.opened_at).toISOString() : new Date().toISOString(),
    description: row.description || '',
    lat: row.lat != null ? Number(row.lat) : undefined,
    lng: row.lng != null ? Number(row.lng) : undefined,
  };
}

export async function getIncidents(): Promise<Incident[]> {
  const res = await pool.query(
    `SELECT id, item_name, location, status, opened_at, description, lat, lng
       FROM incidents
   ORDER BY opened_at DESC NULLS LAST, id DESC`
  );
  return res.rows.map(mapIncident);
}

export type IncidentInput = Omit<Incident, 'openedAt' | 'status'> & { id?: string; status?: Incident['status']; openedAt?: string };

export async function createIncident(incident: IncidentInput): Promise<Incident> {
  const id = incident.id || `INC-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO incidents (id, item_name, location, description, lat, lng, status, opened_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, now()))
     RETURNING *`,
    [
      id,
      incident.itemName,
      incident.location,
      incident.description,
      incident.lat ?? 0,
      incident.lng ?? 0,
      incident.status || 'Aberto',
      incident.openedAt || null,
    ]
  );
  return mapIncident(res.rows[0]);
}

export async function updateIncident(
  id: string,
  data: Partial<Omit<Incident, 'id'>>
): Promise<Incident | null> {
  const parts: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const push = (field: string, value: any) => {
    parts.push(`${field} = $${idx++}`);
    values.push(value);
  };

  if (data.itemName !== undefined) push('item_name', data.itemName);
  if (data.location !== undefined) push('location', data.location);
  if (data.description !== undefined) push('description', data.description);
  if (data.status !== undefined) push('status', data.status);
  if (data.lat !== undefined) push('lat', data.lat);
  if (data.lng !== undefined) push('lng', data.lng);
  if (data.openedAt !== undefined) push('opened_at', data.openedAt);

  if (!parts.length) {
    const existing = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
    if (existing.rowCount === 0) return null;
    return mapIncident(existing.rows[0]);
  }

  values.push(id);
  const res = await pool.query(`UPDATE incidents SET ${parts.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  if (res.rowCount === 0) return null;
  return mapIncident(res.rows[0]);
}

export async function deleteIncident(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM incidents WHERE id = $1', [id]);
  return res.rowCount > 0;
}
