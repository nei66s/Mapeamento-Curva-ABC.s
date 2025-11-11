import pool from './db';
import type { Store } from './types';

export async function listStores(): Promise<Store[]> {
  try {
    // try to read lat/lng if present in the stores table
    const res = await pool.query('SELECT id, name, location, lat, lng FROM stores ORDER BY name ASC');
    return res.rows.map((row: any) => {
      // Normalize fields and try to extract coordinates from different schemas.
      const id = String(row.id);
      const name = row.name;
      const rawLocation = row.location ?? '';

      // Prefer explicit lat/lng columns if present
      let lat = row.lat != null ? Number(row.lat) : null;
      let lng = row.lng != null ? Number(row.lng) : null;

      // If lat/lng are not available, try to parse `location` field for common patterns:
      // - PostGIS WKT: POINT(lon lat)
      // - CSV: "lat,lng" or "lng,lat" (we attempt lat,lng first)
      if ((lat == null || lng == null) && rawLocation && typeof rawLocation === 'string') {
        const wktMatch = rawLocation.match(/POINT\s*\(\s*([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\s*\)/i);
        const csvMatch = rawLocation.match(/([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)/);
        if (wktMatch) {
          // WKT is POINT(lon lat) — note order is lon, lat
          lng = Number(wktMatch[1]);
          lat = Number(wktMatch[2]);
        } else if (csvMatch) {
          // Ambiguous order: assume lat,lng first (common in some exports). If values look reversed,
          // the user can tell us and we can flip the order.
          const a = Number(csvMatch[1]);
          const b = Number(csvMatch[2]);
          // Heuristic: lat is within [-90,90]
          if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
            lat = a; lng = b;
          } else if (b >= -90 && b <= 90 && a >= -180 && a <= 180) {
            // flipped order
            lat = b; lng = a;
          }
        }
      }

      return {
        id,
        name,
        city: rawLocation ?? '',
        lat: lat != null ? lat : 0,
        lng: lng != null ? lng : 0,
      } as Store;
    });
  } catch (err) {
    // If the lat/lng columns don't exist, fall back to the original query
    const res = await pool.query('SELECT id, name, location FROM stores ORDER BY name ASC');
    return res.rows.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      city: row.location ?? '',
      lat: 0,
      lng: 0,
    }));
  }
}

export async function createStore(data: { name: string; location?: string; lat?: number; lng?: number }) {
  const { name, location = '', lat = null, lng = null } = data;
  const res = await pool.query(
    'INSERT INTO stores (name, location, lat, lng) VALUES ($1, $2, $3, $4) RETURNING id, name, location, lat, lng',
    [name, location, lat, lng]
  );
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: row.name,
    city: row.location ?? '',
    lat: row.lat != null ? Number(row.lat) : 0,
    lng: row.lng != null ? Number(row.lng) : 0,
  } as Store;
}

export async function updateStore(id: string, data: { name?: string; location?: string; lat?: number | null; lng?: number | null }) {
  // Build dynamic set clause
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (data.name !== undefined) { sets.push(`name = $${idx++}`); values.push(data.name); }
  if (data.location !== undefined) { sets.push(`location = $${idx++}`); values.push(data.location); }
  if (data.lat !== undefined) { sets.push(`lat = $${idx++}`); values.push(data.lat); }
  if (data.lng !== undefined) { sets.push(`lng = $${idx++}`); values.push(data.lng); }
  if (sets.length === 0) return null;
  values.push(id);
  const q = `UPDATE stores SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, name, location, lat, lng`;
  const res = await pool.query(q, values);
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: row.name,
    city: row.location ?? '',
    lat: row.lat != null ? Number(row.lat) : 0,
    lng: row.lng != null ? Number(row.lng) : 0,
  } as Store;
}

export async function deleteStore(id: string) {
  const res = await pool.query('DELETE FROM stores WHERE id = $1', [id]);
  return res.rowCount > 0;
}
