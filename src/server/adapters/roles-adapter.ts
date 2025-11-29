import pool from '@/lib/db';

async function detectRoleColumns() {
  const res = await pool.query("select column_name from information_schema.columns where table_name='roles'");
  const cols = new Set(res.rows.map((r: any) => String(r.column_name)));
  const nameCol = cols.has('name') ? 'name' : cols.has('key') ? 'key' : cols.has('title') ? 'title' : cols.has('label') ? 'label' : null;
  const descCol = cols.has('description') ? 'description' : cols.has('details') ? 'details' : cols.has('desc') ? 'desc' : null;
  return { nameCol, descCol };
}

export async function listRoles() {
  const { nameCol } = await detectRoleColumns();
  if (nameCol) {
    const res = await pool.query(`select id, ${nameCol} as name from roles order by ${nameCol}`);
    return res.rows;
  }
  const res = await pool.query('select id from roles');
  return res.rows.map((r: any) => ({ id: r.id }));
}

export async function getRoleById(id: string) {
  const { nameCol } = await detectRoleColumns();
  if (nameCol) {
    const res = await pool.query(`select id, ${nameCol} as name from roles where id::text = $1 limit 1`, [id]);
    return res.rows[0] || null;
  }
  const res = await pool.query('select id from roles where id::text = $1 limit 1', [id]);
  return res.rows[0] || null;
}

export async function getRoleByName(name: string) {
  const { nameCol } = await detectRoleColumns();
  if (!nameCol) return null;
  const res = await pool.query(`select id, ${nameCol} as name from roles where ${nameCol} = $1 limit 1`, [name]);
  return res.rows[0] || null;
}

export async function getRolePermissions(roleId: string) {
  // Be tolerant to multiple schema variants:
  // - role_permissions.permission_id may store permission id (as int or text) or the permission key
  // - permissions table may expose `key` or `name` column
  const keyColRes = await pool.query(
    "select column_name from information_schema.columns where table_name='permissions' and column_name in ('key','name') limit 1"
  );
  const keyCol = (keyColRes.rows[0] && keyColRes.rows[0].column_name) || 'name';

  const q = `
    select distinct coalesce(p.${keyCol}::text, rp.permission_id::text) as permission_key
    from role_permissions rp
    left join permissions p on (p.id::text = rp.permission_id OR p.${keyCol}::text = rp.permission_id)
    where rp.role_id = $1
  `;
  const res = await pool.query(q, [roleId]);
  return res.rows.map((r: any) => r.permission_key);
}

export async function createOrUpdateRole(payload: { id?: string; name: string; description?: string; permissions?: string[] }) {
  // Upsert role by detected name column
  const { nameCol, descCol } = await detectRoleColumns();
  let role: any = null;
  if (nameCol) {
    const nameC = nameCol;
    const descC = descCol || 'description';
    const q = `INSERT INTO roles (${nameC}, ${descC}) VALUES ($1, $2)
      ON CONFLICT (${nameC}) DO UPDATE SET ${descC} = COALESCE(EXCLUDED.${descC}, roles.${descC})
      RETURNING id, ${nameC} as name, ${descC} as description`;
    const res = await pool.query(q, [payload.name, payload.description || null]);
    role = res.rows[0];
  } else {
    // fallback: try basic insert returning id
    const res = await pool.query('INSERT INTO roles DEFAULT VALUES RETURNING id');
    role = res.rows[0];
  }

  // sync permissions if provided
  if (Array.isArray(payload.permissions)) {
    // delete existing mappings for this role (role_id stored as text in migration)
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [String(role.id)]);
    for (const permKey of payload.permissions) {
      // try to find permission by key or name
      const p = await pool.query(
        "SELECT id FROM permissions WHERE (key = $1) OR (name = $1) LIMIT 1",
        [permKey]
      );
      const pid = p.rows[0] ? String(p.rows[0].id) : String(permKey);
      await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING', [String(role.id), pid]);
    }
  }
  return role;
}

export async function updateRoleById(id: string, patch: Partial<{ name: string; description: string; permissions: string[] }>) {
  const { nameCol, descCol } = await detectRoleColumns();
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  if (patch.name !== undefined && nameCol) { sets.push(`${nameCol} = $${idx++}`); vals.push(patch.name); }
  if (patch.description !== undefined && descCol) { sets.push(`${descCol} = $${idx++}`); vals.push(patch.description); }
  if (sets.length) {
    vals.push(id);
    const q = `UPDATE roles SET ${sets.join(', ')} WHERE id::text = $${idx} RETURNING id, ${nameCol ? nameCol + ' as name' : 'id'}, ${descCol ? descCol + ' as description' : 'NULL as description'}`;
    const r = await pool.query(q, vals);
    if (r.rowCount === 0) return null;
  }

  if (patch.permissions) {
    // sync permissions
    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
    for (const permKey of patch.permissions) {
      const p = await pool.query("SELECT id FROM permissions WHERE (key = $1) OR (name = $1) LIMIT 1", [permKey]);
      const pid = p.rows[0] ? String(p.rows[0].id) : String(permKey);
      await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING', [id, pid]);
    }
  }
  const final = await getRoleById(id);
  return final;
}

export async function deleteRoleById(id: string) {
  // remove role permissions first
  await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
  await pool.query('DELETE FROM roles WHERE id::text = $1', [id]);
  return true;
}
