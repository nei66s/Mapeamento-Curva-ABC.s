import pool from '@/lib/db';
import { getRolePermissions } from './roles-adapter';

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash?: string | null;
  role?: string | null;
  created_at?: string | null;
  roles?: string[];
  profile?: any;
};

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const colsRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name in ('password_hash','password','permissions')"
  );
  const cols = new Set(colsRes.rows.map((r: any) => String(r.column_name)));
  const selectCols = ['id', 'name', 'email', 'role', 'created_at'];
  if (cols.has('password_hash')) selectCols.splice(3, 0, 'password_hash');
  else if (cols.has('password')) selectCols.splice(3, 0, 'password');
  if (cols.has('permissions')) selectCols.push('permissions');

  const q = `select ${selectCols.join(', ')} from users where email = $1 limit 1`;
  const res = await pool.query(q, [email]);
  const row = res.rows[0];
  if (!row) return null;

  if (!row.password_hash && row.password) {
    row.password_hash = row.password;
    delete row.password;
  }
  if (row.permissions && typeof row.permissions === 'string') {
    try {
      if (row.permissions === '') row.permissions = [];
      else row.permissions = JSON.parse(row.permissions);
    } catch (e) { row.permissions = [] }
  }

  try {
    const rolesRes = await pool.query(`SELECT r.name FROM user_roles ur JOIN roles r ON r.id::text = ur.role_id WHERE ur.user_id = $1`, [String(row.id)]);
    row.roles = rolesRes.rows.map((r: any) => String(r.name));
  } catch (e) { row.roles = []; }
  try {
    const prof = await pool.query(`SELECT extra FROM user_profile WHERE user_id = $1 LIMIT 1`, [String(row.id)]);
    row.profile = prof.rowCount ? prof.rows[0].extra : null;
  } catch (e) { row.profile = null; }

  return row || null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const colsRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name in ('password_hash','password','permissions')"
  );
  const cols = new Set(colsRes.rows.map((r: any) => String(r.column_name)));
  const selectCols = ['id', 'name', 'email', 'role', 'created_at'];
  if (cols.has('password_hash')) selectCols.splice(3, 0, 'password_hash');
  else if (cols.has('password')) selectCols.splice(3, 0, 'password');
  if (cols.has('permissions')) selectCols.push('permissions');

  const q = `select ${selectCols.join(', ')} from users where id = $1 limit 1`;
  const res = await pool.query(q, [id]);
  const row = res.rows[0];
  if (!row) return null;
  if (!row.password_hash && row.password) {
    row.password_hash = row.password;
    delete row.password;
  }
  if (row.permissions && typeof row.permissions === 'string') {
    try {
      if (row.permissions === '') row.permissions = [];
      else row.permissions = JSON.parse(row.permissions);
    } catch (e) { row.permissions = [] }
  }
  try {
    const rolesRes = await pool.query(`SELECT r.name FROM user_roles ur JOIN roles r ON r.id::text = ur.role_id WHERE ur.user_id = $1`, [String(row.id)]);
    row.roles = rolesRes.rows.map((r: any) => String(r.name));
  } catch (e) { row.roles = []; }
  try {
    const prof = await pool.query(`SELECT extra FROM user_profile WHERE user_id = $1 LIMIT 1`, [String(row.id)]);
    row.profile = prof.rowCount ? prof.rows[0].extra : null;
  } catch (e) { row.profile = null; }

  return row || null;
}

async function derivePermissionsFromRoles(userId: string) {
  const res = await pool.query("select role_id from user_roles where user_id = $1", [userId]);
  if (!res.rowCount) return [];
  const permsSet = new Set<string>();
  for (const r of res.rows) {
    const roleId = String(r.role_id);
    const rolePerms = await getRolePermissions(roleId);
    for (const p of rolePerms) permsSet.add(p);
  }
  return Array.from(permsSet);
}

export async function listUsers(limit = 50, offset = 0, filters?: { email?: string; role?: string; status?: string }) {
  // Prefer a unified view `users_full` when it exists (provides roles array and profile JSONB)
  try {
    const viewCheck = await pool.query("select to_regclass('public.users_full') as reg");
    const hasUsersFull = Boolean(viewCheck.rows[0] && viewCheck.rows[0].reg);
    if (hasUsersFull) {
      // build where clause from filters
      const where: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      if (filters?.email) { where.push(`email ILIKE $${idx++}`); vals.push(`%${filters.email}%`); }
      if (filters?.role) { where.push(`(role = $${idx} OR roles @> ARRAY[$${idx}]::text[])`); vals.push(filters.role); idx++; }
      if (filters?.status) { where.push(`status = $${idx++}`); vals.push(filters.status); }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const qv = `select id, name, email, role, created_at, status, permissions, roles as roles_arr, profile from users_full ${whereClause} order by created_at desc limit $${idx} offset $${idx + 1}`;
      const rv = await pool.query(qv, [...vals, limit, offset]);
      const rows = rv.rows.map((r: any) => {
        // normalize names to match existing adapter shape
        const out: any = {
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role,
          created_at: r.created_at,
          status: r.status ?? null,
          permissions: r.permissions ?? undefined,
          roles: Array.isArray(r.roles_arr) ? r.roles_arr : (r.roles || []),
          profile: r.profile ?? null,
        };
        return out;
      });
      // augment lastAccessAt as before
      await Promise.all(rows.map(async (r: any) => {
        try {
          const last = await pool.query("select created_at from audit_logs where user_id = $1 and action in ('user.login','login') order by created_at desc limit 1", [r.id]);
          if (last.rowCount) {
            r.lastAccessAt = last.rows[0].created_at instanceof Date ? last.rows[0].created_at.toISOString() : String(last.rows[0].created_at);
          }
        } catch (e) {}
      }));
      return rows;
    }
  } catch (e) {
    // if view check fails, fall back to regular query below
  }
  const colsRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name = 'permissions'"
  );
  const hasPerm = colsRes.rowCount > 0;
  const colsStatusRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name = 'status'"
  );
  const hasStatus = colsStatusRes.rowCount > 0;

  // detect whether the user_profile table exists to avoid referencing it in SQL when absent
  const profileTableRes = await pool.query("select to_regclass('public.user_profile') as reg");
  const hasUserProfile = Boolean(profileTableRes.rows[0] && profileTableRes.rows[0].reg);

  const selectExtra = `${hasStatus ? ', u.status' : ''}${hasPerm ? ', u.permissions' : ''}`;

  const profileSelect = hasUserProfile
    ? `(SELECT extra FROM user_profile up WHERE up.user_id = u.id::text LIMIT 1) as profile`
    : `null as profile`;

  // Build WHERE using filters when possible, then aggregate roles
  const whereClauses: string[] = [];
  const whereVals: any[] = [];
  let wIdx = 1;
  if (filters?.email) { whereClauses.push(`u.email ILIKE $${wIdx++}`); whereVals.push(`%${filters.email}%`); }
  if (filters?.role) { whereClauses.push(`(u.role = $${wIdx} OR r.name = $${wIdx})`); whereVals.push(filters.role); wIdx++; }
  if (filters?.status && hasStatus) { whereClauses.push(`u.status = $${wIdx++}`); whereVals.push(filters.status); }

  const whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const q = `
    SELECT u.id, u.name, u.email, u.role, u.created_at${selectExtra},
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('name', r.name)) FILTER (WHERE r.name IS NOT NULL), '[]') as roles_agg,
      ${profileSelect}
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id::text
    LEFT JOIN roles r ON r.id::text = ur.role_id
    ${whereClause}
    GROUP BY u.id, u.name, u.email, u.role, u.created_at${hasStatus ? ', u.status' : ''}${hasPerm ? ', u.permissions' : ''}
    ORDER BY u.created_at DESC
    LIMIT $${wIdx} OFFSET $${wIdx + 1}
  `;

  const res = await pool.query(q, [...whereVals, limit, offset]);
  const rows = res.rows.map((r: any) => {
    if (r.permissions && typeof r.permissions === 'string') {
      try {
        if (r.permissions === '') r.permissions = [];
        else r.permissions = JSON.parse(r.permissions);
      } catch (e) { r.permissions = [] }
    }
    try {
      r.roles = Array.isArray(r.roles_agg) ? r.roles_agg.map((x: any) => x.name) : [];
    } catch (e) { r.roles = []; }
    delete r.roles_agg;
    r.profile = r.profile ?? null;
    return r;
  });

  await Promise.all(rows.map(async (r: any) => {
    try {
      const last = await pool.query("select created_at from audit_logs where user_id = $1 and action in ('user.login','login') order by created_at desc limit 1", [r.id]);
      if (last.rowCount) {
        r.lastAccessAt = last.rows[0].created_at instanceof Date ? last.rows[0].created_at.toISOString() : String(last.rows[0].created_at);
      }
    } catch (e) {}
  }));

  return rows;
}

export async function createUser(u: { id?: string; name: string; email: string; password_hash?: string | null; role?: string }) {
  // Ensure we never insert NULL into password_hash (some installations have NOT NULL constraint)
  const passwordHash = u.password_hash ?? '';
  const res = await pool.query(
    `insert into users(id, name, email, password_hash, role, created_at)
      values (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, now())
      returning id, name, email, role, created_at`,
    [u.id || null, u.name, u.email, passwordHash, u.role || null]
  );
  return res.rows[0];
}

export async function updateUser(id: string, patch: Partial<{ name: string; email: string; password_hash: string | null; role: string }>) {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k} = $${idx}`);
    vals.push(v);
    idx++;
  }
  if (!sets.length) return getUserById(id);
  vals.push(id);
  const q = `update users set ${sets.join(', ')} where id = $${idx} returning id, name, email, role, created_at`;
  const res = await pool.query(q, vals);
  return res.rows[0];
}

export async function deleteUser(id: string) {
  await pool.query('delete from users where id = $1', [id]);
  return true;
}
