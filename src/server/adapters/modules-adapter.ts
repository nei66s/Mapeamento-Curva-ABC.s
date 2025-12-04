import pool from '@/lib/db';

function normalizeModuleRow(row: any) {
  if (!row) return null;
  const isActive = row.is_active ?? row.active ?? false;
  // SQL alias uses visibleInMenu
  const visible = row.visibleInMenu ?? row.is_visible ?? row.visible ?? false;
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description ?? '',
    is_active: isActive,
    active: isActive,
    is_visible: visible,
    visibleInMenu: visible,
    beta: row.beta,
    dependencies: row.dependencies,
  };
}

export async function listModules() {
  const res = await pool.query(`select id, key, name, coalesce(description, '') as description, is_active, is_visible as "visibleInMenu", beta, dependencies from modules order by name`);
  return res.rows.map(normalizeModuleRow);
}

export async function getModuleByKey(key: string) {
  const res = await pool.query(`select id, key, name, coalesce(description, '') as description, is_active, is_visible as "visibleInMenu", beta, dependencies from modules where key = $1 limit 1`, [key]);
  return normalizeModuleRow(res.rows[0]) || null;
}
export async function updateModuleByKey(key: string, patch: Partial<{ is_active: boolean; is_visible: boolean; name: string; beta?: boolean }>) {
  // Accept either a module `key` (string slug) or an `id` (UUID).
  const isUuid = typeof key === 'string' && /^[0-9a-fA-F\-]{36}$/.test(key);
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k} = $${idx}`);
    vals.push(v);
    idx++;
  }
  if (!sets.length) return isUuid ? getModuleByKeyById(key) : getModuleByKey(key);
  vals.push(key);
  const where = isUuid ? `id = $${idx}` : `key = $${idx}`;
  const q = `update modules set ${sets.join(', ')} where ${where} returning id, key, name, coalesce(description, '') as description, is_active, is_visible as "visibleInMenu", beta, dependencies`;
  const res = await pool.query(q, vals);
  return normalizeModuleRow(res.rows[0]) || null;
}

export async function getModuleByKeyById(id: string) {
  const res = await pool.query(`select id, key, name, coalesce(description, '') as description, is_active, is_visible as "visibleInMenu", beta, dependencies from modules where id = $1 limit 1`, [id]);
  return normalizeModuleRow(res.rows[0]) || null;
}

export async function getActiveModules() {
  const res = await pool.query('select key, name from modules where is_active = true order by name');
  return res.rows;
}
