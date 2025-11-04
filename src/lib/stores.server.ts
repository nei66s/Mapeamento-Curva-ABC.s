import pool from './db';
import type { Store } from './types';

export async function listStores(): Promise<Store[]> {
  const res = await pool.query('SELECT id, name, location FROM stores ORDER BY name ASC');
  return res.rows.map((row: any) => ({
    id: String(row.id),
    name: row.name,
    city: row.location ?? '',
    lat: 0,
    lng: 0,
  }));
}
