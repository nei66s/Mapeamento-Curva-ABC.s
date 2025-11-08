import pool from './db';

export type RolePermission = {
  role: string;
  module_id: string;
  allowed: boolean;
};

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT NOT NULL,
      module_id TEXT NOT NULL,
      allowed BOOLEAN NOT NULL DEFAULT false,
      PRIMARY KEY (role, module_id)
    )
  `);
}

export async function listRolePermissions(): Promise<RolePermission[]> {
  await ensureTable();
  const res = await pool.query('SELECT role, module_id, allowed FROM role_permissions');
  return res.rows as RolePermission[];
}

export async function getPermissionsMapping(): Promise<Record<string, Record<string, boolean>>> {
  const rows = await listRolePermissions();
  const map: Record<string, Record<string, boolean>> = {};
  for (const r of rows) {
    if (!map[r.role]) map[r.role] = {};
    map[r.role][r.module_id] = Boolean(r.allowed);
  }
  return map;
}

export async function setPermission(role: string, moduleId: string, allowed: boolean): Promise<void> {
  await ensureTable();
  await pool.query(
    `INSERT INTO role_permissions (role, module_id, allowed) VALUES ($1, $2, $3)
     ON CONFLICT (role, module_id) DO UPDATE SET allowed = EXCLUDED.allowed`,
    [role, moduleId, allowed]
  );
}

