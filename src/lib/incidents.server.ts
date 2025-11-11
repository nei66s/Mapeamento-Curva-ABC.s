import { randomUUID } from 'crypto';
import { Incident } from './types';
import pool from './db';

// Resolve a store's id from its name. Tries exact match then ILIKE as fallback.
async function resolveStoreId(location?: string | null): Promise<string | null> {
  if (!location) return null;
  try {
    const exact = await pool.query('SELECT id FROM stores WHERE name = $1 LIMIT 1', [location]);
    if (exact.rowCount > 0) return String(exact.rows[0].id);
    const ilike = await pool.query('SELECT id FROM stores WHERE name ILIKE $1 LIMIT 1', [location]);
    if (ilike.rowCount > 0) return String(ilike.rows[0].id);
  } catch (e) {
    console.warn('resolveStoreId: lookup failed', String(e));
  }
  return null;
}

function mapIncident(row: any): Incident {
  return {
    id: String(row.id),
    storeId: row.store_id != null ? String(row.store_id) : undefined,
    title: row.title || row.itemname || '',
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
  try {
    const res = await pool.query(
      `SELECT id, store_id, title, item_name, location, status, opened_at, description, lat, lng
         FROM incidents
     ORDER BY opened_at DESC NULLS LAST, id DESC`
    );
    return res.rows.map(mapIncident);
  } catch (err: any) {
    // log structured error info to help debugging DB connection / query issues
    try {
      console.error('getIncidents: DB query failed', {
        code: err?.code ?? null,
        message: String(err?.message ?? err),
      });
    } catch (logErr) {
      // fallback logging
      console.error('getIncidents: DB query failed (logging error)', String(err));
    }
    // rethrow so callers (API route) can handle fallback behavior
    throw err;
  }
}

export type IncidentInput = Omit<Incident, 'openedAt' | 'status'> & { id?: string; status?: Incident['status']; openedAt?: string };

export async function createIncident(incident: IncidentInput): Promise<Incident> {
  const id = incident.id || `INC-${randomUUID()}`;
  // Resolve store id if not provided by the client
  const resolvedStoreId = (incident as any).storeId ?? (await resolveStoreId(incident.location)) ?? null;

  // Try inserting including the app-generated id (string). Some databases may have an
  // integer/serial id column; in that case Postgres will throw 22P02 when trying to
  // cast a non-numeric string. If that happens, retry the insert omitting the id so
  // the DB can generate its own numeric id.
  try {
    const res = await pool.query(
      `INSERT INTO incidents (id, store_id, title, item_name, location, description, lat, lng, status, opened_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, now()))
       RETURNING *`,
      [
        id,
        resolvedStoreId,
        (incident as any).title ?? incident.itemName,
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
  } catch (err: any) {
    // If the error indicates invalid input syntax for integer (22P02), retry without id
    if (err && (err.code === '22P02' || String(err.message || '').includes('invalid input syntax for type integer'))) {
      console.warn('createIncident: DB rejected string id, retrying insert without id to allow DB-generated numeric id');
      const res2 = await pool.query(
        `INSERT INTO incidents (store_id, title, item_name, location, description, lat, lng, status, opened_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, now()))
         RETURNING *`,
        [
          resolvedStoreId,
          (incident as any).title ?? incident.itemName,
          incident.itemName,
          incident.location,
          incident.description,
          incident.lat ?? 0,
          incident.lng ?? 0,
          incident.status || 'Aberto',
          incident.openedAt || null,
        ]
      );
      return mapIncident(res2.rows[0]);
    }
    throw err;
  }
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
  if ((data as any).title !== undefined) push('title', (data as any).title);
  if (data.location !== undefined) push('location', data.location);
  if (data.description !== undefined) push('description', data.description);
  if (data.status !== undefined) push('status', data.status);
  if ((data as any).storeId !== undefined) push('store_id', (data as any).storeId);
  // If client provided a new location but no explicit storeId, try to resolve it
  if ((data as any).storeId === undefined && data.location !== undefined) {
    const resolved = await resolveStoreId(data.location as string | undefined);
    if (resolved !== null) push('store_id', resolved);
  }
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

export type ParetoRow = {
  itemName: string;
  count: number;
  pct: number; // percentage of total (0-100)
  cumulativeCount: number;
  cumulativePct: number; // cumulative percentage (0-100)
};

/**
 * Get Pareto matrix for incidents grouped by item name or title.
 *
 * @param top number of rows to return (default 7)
 * @param groupBy 'item' to group by `item_name` (default) or 'title' to group by `title`
 */
export async function getParetoItems(top = 7, groupBy: 'item' | 'title' = 'item'): Promise<ParetoRow[]> {
  // Choose grouping expression depending on requested field.
  let groupExpr = "COALESCE(item_name, '')";
  if (groupBy === 'title') {
    // prefer explicit title, fallback to item_name if title is empty
    groupExpr = "COALESCE(title, item_name, '')";
  }

  const sql = `
    SELECT group_key,
           cnt,
           ROUND(100.0 * cnt / SUM(cnt) OVER(), 2) AS pct,
           SUM(cnt) OVER (ORDER BY cnt DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_count,
           ROUND(100.0 * SUM(cnt) OVER (ORDER BY cnt DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / SUM(cnt) OVER(), 2) AS cumulative_pct
      FROM (
        SELECT ${groupExpr} AS group_key, COUNT(*)::int AS cnt
          FROM incidents
         GROUP BY ${groupExpr}
      ) t
     ORDER BY cnt DESC
     LIMIT $1
  `;

  const res = await pool.query(sql, [top]);
  if (!res || !res.rows || res.rowCount === 0) return [];

  return res.rows.map((r: any) => ({
    itemName: String(r.group_key ?? ''),
    count: Number(r.cnt ?? 0),
    pct: Number(r.pct ?? 0),
    cumulativeCount: Number(r.cumulative_count ?? 0),
    cumulativePct: Number(r.cumulative_pct ?? 0),
  }));
}

/**
 * Convenience helper: Pareto analysis specifically by incident `title`.
 * Returns the top `top` titles by incident count (default 7).
 *
 * Usage examples:
 *
 * Server-side (server-only module):
 *   import { getParetoByTitle } from '@/lib/incidents.server';
 *   const topTitles = await getParetoByTitle(7);
 *
 * From the frontend (fetch from API route):
 *   const res = await fetch('/api/incidents/pareto?group=title&top=7');
 *   const json = await res.json(); // array of { itemName, count, pct, cumulativeCount, cumulativePct }
 */
export async function getParetoByTitle(top = 7): Promise<ParetoRow[]> {
  return getParetoItems(top, 'title');
}
