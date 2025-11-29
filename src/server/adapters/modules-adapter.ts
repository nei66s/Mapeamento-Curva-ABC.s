import pool from '@/lib/db';

export async function listModules() {
  const res = await pool.query('select id, key, name, is_active, is_visible from modules order by name');
  return res.rows;
}

export async function getModuleByKey(key: string) {
  const res = await pool.query('select id, key, name, is_active, is_visible from modules where key = $1 limit 1', [key]);
  return res.rows[0] || null;
}

export async function updateModuleByKey(key: string, patch: Partial<{ is_active: boolean; is_visible: boolean; name: string }>) {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k} = $${idx}`);
    vals.push(v);
    idx++;
  }
  if (!sets.length) return getModuleByKey(key);
  vals.push(key);
  const q = `update modules set ${sets.join(', ')} where key = $${idx} returning id, key, name, is_active, is_visible`;
  const res = await pool.query(q, vals);
  return res.rows[0];
}

export async function getActiveModules() {
  const res = await pool.query('select key, name from modules where is_active = true order by name');
  return res.rows;
}
