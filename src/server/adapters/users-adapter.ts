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
  // Detect which password column exists and select only those to avoid SQL errors
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
  // Optimize listUsers to avoid N+1 queries: aggregate roles and fetch profile in one query
  const q = `
    SELECT u.id, u.name, u.email, u.role, u.created_at${hasStatus ? ', u.status' : ''}${hasPerm ? ', u.permissions' : ''},
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('name', r.name)) FILTER (WHERE r.name IS NOT NULL), '[]') as roles_agg,
      (SELECT extra FROM user_profile up WHERE up.user_id = u.id::text LIMIT 1) as profile
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id::text
    LEFT JOIN roles r ON r.id::text = ur.role_id
    GROUP BY u.id, u.name, u.email, u.role, u.created_at${hasStatus ? ', u.status' : ''}${hasPerm ? ', u.permissions' : ''}
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const res = await pool.query(q, [limit, offset]);
  const rows = res.rows.map((r: any) => {
    // normalize permissions
    if (r.permissions && typeof r.permissions === 'string') {
      try {
        if (r.permissions === '') r.permissions = [];
        else r.permissions = JSON.parse(r.permissions);
      } catch (e) { r.permissions = [] }
    }
    // roles_agg comes as JSONB array of objects with {name}; normalize to string array
    try {
      r.roles = Array.isArray(r.roles_agg) ? r.roles_agg.map((x: any) => x.name) : [];
    } catch (e) { r.roles = []; }
    delete r.roles_agg;
    // profile is JSONB or null
    r.profile = r.profile ?? null;
    return r;
  });

  // enrich rows with lastAccessAt from audit_logs when available
  await Promise.all(rows.map(async (r: any) => {
    try {
      const last = await pool.query("select created_at from audit_logs where user_id = $1 and action in ('user.login','login') order by created_at desc limit 1", [r.id]);
      if (last.rowCount) {
        r.lastAccessAt = last.rows[0].created_at instanceof Date ? last.rows[0].created_at.toISOString() : String(last.rows[0].created_at);
      }
    } catch (e) {}
  }));

  return rows;
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
  // user_roles may store user_id as text; select all role_ids for this user id
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

export async function listUsers(limit = 50, offset = 0) {
  // try to include permissions if available
  const colsRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name = 'permissions'"
  );
  const hasPerm = colsRes.rowCount > 0;
  // Also detect optional 'status' column to include it in list queries
  const colsStatusRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name = 'status'"
  );
  const hasStatus = colsStatusRes.rowCount > 0;

  const q = hasPerm
    ? `select id, name, email, role, created_at${hasStatus ? ', status' : ''}, permissions from users order by created_at desc limit $1 offset $2`
    : `select id, name, email, role, created_at${hasStatus ? ', status' : ''} from users order by created_at desc limit $1 offset $2`;
  const res = await pool.query(q, [limit, offset]);
  if (hasPerm) {
    const rows = res.rows.map((r: any) => {
      if (r.permissions && typeof r.permissions === 'string') {
        try {
          if (r.permissions === '') r.permissions = [];
          else r.permissions = JSON.parse(r.permissions);
        } catch (e) { r.permissions = [] }
      }
      return r;
    });

    // enrich rows with lastAccessAt from audit_logs when available
    await Promise.all(rows.map(async (r: any) => {
      try {
        const last = await pool.query("select created_at from audit_logs where user_id = $1 and action in ('user.login','login') order by created_at desc limit 1", [r.id]);
        if (last.rowCount) {
          // provide camelCase field expected by frontend
          r.lastAccessAt = last.rows[0].created_at instanceof Date ? last.rows[0].created_at.toISOString() : String(last.rows[0].created_at);
        }
      } catch (e) {
        // ignore enrichment errors
      }
    }));

    // attach roles and profile per-row
    await Promise.all(rows.map(async (r: any) => {
      try {
        const rolesRes = await pool.query(`SELECT r.name FROM user_roles ur JOIN roles r ON r.id::text = ur.role_id WHERE ur.user_id = $1`, [String(r.id)]);
        r.roles = rolesRes.rows.map((x: any) => String(x.name));
      } catch (e) { r.roles = []; }
      try {
        const prof = await pool.query(`SELECT extra FROM user_profile WHERE user_id = $1 LIMIT 1`, [String(r.id)]);
        r.profile = prof.rowCount ? prof.rows[0].extra : null;
      } catch (e) { r.profile = null; }
    }));

    return rows;
  }
  // if no `permissions` column, derive from roles where possible
  const rows = res.rows;
  const mapped = await Promise.all(rows.map(async (r: any) => {
    if (!r.permissions) {
      r.permissions = await derivePermissionsFromRoles(String(r.id));
    }
    return r;
  }));
  // enrich mapped rows with lastAccessAt from audit_logs when available
  await Promise.all(mapped.map(async (r: any) => {
    try {
      const last = await pool.query("select created_at from audit_logs where user_id = $1 and action in ('user.login','login') order by created_at desc limit 1", [r.id]);
      if (last.rowCount) {
        r.lastAccessAt = last.rows[0].created_at instanceof Date ? last.rows[0].created_at.toISOString() : String(last.rows[0].created_at);
      }
    } catch (e) {}
  }));
  // attach roles and profile to mapped rows
  await Promise.all(mapped.map(async (r: any) => {
    try {
      const rolesRes = await pool.query(`SELECT r.name FROM user_roles ur JOIN roles r ON r.id::text = ur.role_id WHERE ur.user_id = $1`, [String(r.id)]);
      r.roles = rolesRes.rows.map((x: any) => String(x.name));
    } catch (e) { r.roles = []; }
    try {
      const prof = await pool.query(`SELECT extra FROM user_profile WHERE user_id = $1 LIMIT 1`, [String(r.id)]);
      r.profile = prof.rowCount ? prof.rows[0].extra : null;
    } catch (e) { r.profile = null; }
  }));

  return mapped;
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
