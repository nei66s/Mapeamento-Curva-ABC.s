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
