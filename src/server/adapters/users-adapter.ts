import pool from '@/lib/db';
import { getRolePermissions } from './roles-adapter';

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash?: string | null;
  role?: string | null;
  created_at?: string | null;
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
  const row = res.rows[0];
  if (!row) return null;
  // Normalize password field to `password_hash` for compatibility
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
  const q = hasPerm
    ? 'select id, name, email, role, created_at, permissions from users order by created_at desc limit $1 offset $2'
    : 'select id, name, email, role, created_at from users order by created_at desc limit $1 offset $2';
  const res = await pool.query(q, [limit, offset]);
  if (hasPerm) {
    return res.rows.map((r: any) => {
      if (r.permissions && typeof r.permissions === 'string') {
        try {
          if (r.permissions === '') r.permissions = [];
          else r.permissions = JSON.parse(r.permissions);
        } catch (e) { r.permissions = [] }
      }
      // if permissions is null/undefined, will be derived later
      return r;
    });
  }
  // if no `permissions` column, derive from roles where possible
  const rows = res.rows;
  const mapped = await Promise.all(rows.map(async (r: any) => {
    if (!r.permissions) {
      r.permissions = await derivePermissionsFromRoles(String(r.id));
    }
    return r;
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
