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

export type UserProfilePreferences = {
  phone?: string | null;
  hasWhatsapp?: boolean;
  whatsappNotifications?: boolean;
  avatarUrl?: string | null;
};

function parseProfileExtra(extra: unknown): Record<string, any> {
  if (!extra) return {};
  if (typeof extra === 'object' && !Array.isArray(extra)) return extra as Record<string, any>;
  if (typeof extra === 'string') {
    try {
      return JSON.parse(extra);
    } catch (err) {
      return {};
    }
  }
  return {};
}

function mergeProfileRow(row: { phone?: string | null; extra?: unknown } | null | undefined) {
  if (!row) return null;
  const base = parseProfileExtra(row.extra);
  if (row.phone !== undefined && row.phone !== null) {
    base.phone = row.phone;
  }
  if (!Object.keys(base).length) {
    return row.phone ? { phone: row.phone } : null;
  }
  return base;
}

function extractAvatarFromProfile(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const candidates = [
    (profile as any).avatarUrl,
    (profile as any).avatar_url,
    (profile as any).avatar,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
}

function applyAvatarFallbackFromProfile(target: any) {
  if (!target) return;
  const current = target.avatarUrl;
  if (typeof current === 'string' && current.trim()) {
    return;
  }
  const fallback = extractAvatarFromProfile(target.profile);
  if (fallback) {
    target.avatarUrl = fallback;
  }
}

let cachedUserProfileTableExists: boolean | null = null;
let cachedUserProfileHasPhoneColumn: boolean | null = null;
let cachedUserProfileHasExtraColumn: boolean | null = null;
let cachedUserProfileHasUpdatedAtColumn: boolean | null = null;

const userColumnAliasCandidates: Record<string, string[]> = {
  avatar_url: ['avatar_url', 'avatarUrl', 'avatarurl'],
  avatar_data: ['avatar_data', 'avatarData'],
};

const cachedUserColumnAlias: Record<string, string | null> = {};

async function resolveUserColumnAlias(key: string, candidates: string[]): Promise<string | null> {
  if (Object.prototype.hasOwnProperty.call(cachedUserColumnAlias, key)) {
    return cachedUserColumnAlias[key];
  }
  try {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = ANY($1::text[])`,
      [candidates]
    );
    const available = new Set(res.rows.map((r: any) => String(r.column_name)));
    for (const candidate of candidates) {
      if (available.has(candidate)) {
        cachedUserColumnAlias[key] = candidate;
        return candidate;
      }
    }
  } catch (error) {
    cachedUserColumnAlias[key] = null;
    return null;
  }
  cachedUserColumnAlias[key] = null;
  return null;
}

function quoteIdentifier(name: string) {
  const escaped = name.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildAvatarSelectForList(column: string | null) {
  if (!column) {
    return { select: '', group: '' };
  }
  const quoted = `u.${quoteIdentifier(column)}`;
  return {
    select: `, ${quoted} as avatarUrl`,
    group: `, ${quoted}`,
  };
}

function buildAvatarBinaryFlag(column: string | null) {
  if (!column) {
    return { select: '', group: '' };
  }
  const expression = `u.${quoteIdentifier(column)} IS NOT NULL`;
  return {
    select: `, ${expression} as hasAvatarBlob`,
    group: `, ${expression}`,
  };
}

async function ensureUserProfileMetadata(): Promise<{
  exists: boolean;
  hasPhone: boolean;
  hasExtra: boolean;
  hasUpdatedAt: boolean;
}> {
  if (
    cachedUserProfileTableExists !== null &&
    cachedUserProfileHasPhoneColumn !== null &&
    cachedUserProfileHasExtraColumn !== null &&
    cachedUserProfileHasUpdatedAtColumn !== null
  ) {
    return {
      exists: cachedUserProfileTableExists,
      hasPhone: Boolean(cachedUserProfileHasPhoneColumn),
      hasExtra: Boolean(cachedUserProfileHasExtraColumn),
      hasUpdatedAt: Boolean(cachedUserProfileHasUpdatedAtColumn),
    };
  }
  try {
    const res = await pool.query("select to_regclass('public.user_profile') as reg");
    const exists = Boolean(res.rows[0] && res.rows[0].reg);
    if (!exists) {
      cachedUserProfileTableExists = false;
      cachedUserProfileHasPhoneColumn = false;
      cachedUserProfileHasExtraColumn = false;
      cachedUserProfileHasUpdatedAtColumn = false;
      return { exists: false, hasPhone: false, hasExtra: false, hasUpdatedAt: false };
    }
    const colRes = await pool.query(
      "select column_name from information_schema.columns where table_name = 'user_profile' and column_name = ANY($1::text[])",
      [['phone', 'extra', 'updated_at']]
    );
    const columns = new Set(colRes.rows.map((r: any) => String(r.column_name)));
    cachedUserProfileTableExists = true;
    cachedUserProfileHasPhoneColumn = columns.has('phone');
    cachedUserProfileHasExtraColumn = columns.has('extra');
    cachedUserProfileHasUpdatedAtColumn = columns.has('updated_at');
    return {
      exists: true,
      hasPhone: cachedUserProfileHasPhoneColumn,
      hasExtra: cachedUserProfileHasExtraColumn,
      hasUpdatedAt: cachedUserProfileHasUpdatedAtColumn,
    };
  } catch (e) {
    cachedUserProfileTableExists = false;
    cachedUserProfileHasPhoneColumn = false;
    cachedUserProfileHasExtraColumn = false;
    cachedUserProfileHasUpdatedAtColumn = false;
    return { exists: false, hasPhone: false, hasExtra: false, hasUpdatedAt: false };
  }
}

async function loadUserProfile(userId: string) {
  const meta = await ensureUserProfileMetadata();
  if (!meta.exists) return null;
  if (!meta.hasPhone && !meta.hasExtra) {
    return null;
  }
  const selectColumns: string[] = [];
  if (meta.hasPhone) selectColumns.push('phone');
  if (meta.hasExtra) selectColumns.push('extra');
  const query = `SELECT ${selectColumns.join(', ')} FROM user_profile WHERE user_id = $1 LIMIT 1`;
  try {
    const res = await pool.query(query, [String(userId)]);
    if (!res.rowCount) return null;
    return mergeProfileRow(res.rows[0]);
  } catch (e) {
    // table might not exist or another issue occurred
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const colsRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name in ('password_hash','password','permissions')"
  );
  const cols = new Set(colsRes.rows.map((r: any) => String(r.column_name)));
  const selectCols = ['id', 'name', 'email', 'role', 'created_at'];
  if (cols.has('password_hash')) selectCols.splice(3, 0, 'password_hash');
  else if (cols.has('password')) selectCols.splice(3, 0, 'password');
  if (cols.has('permissions')) selectCols.push('permissions');
  const avatarColumn = await resolveUserColumnAlias('avatar_url', ['avatar_url', 'avatarUrl', 'avatarurl']);
  if (avatarColumn) {
    selectCols.push(`${quoteIdentifier(avatarColumn)} as avatarUrl`);
  }

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
  row.profile = await loadUserProfile(row.id);
  applyAvatarFallbackFromProfile(row);

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
  const avatarColumn = await resolveUserColumnAlias('avatar_url', ['avatar_url', 'avatarUrl', 'avatarurl']);
  if (avatarColumn) {
    selectCols.push(`${quoteIdentifier(avatarColumn)} as avatarUrl`);
  }

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
  row.profile = await loadUserProfile(row.id);
  applyAvatarFallbackFromProfile(row);

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
  const colsRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name = 'permissions'"
  );
  const hasPerm = colsRes.rowCount > 0;
  const colsStatusRes = await pool.query(
    "select column_name from information_schema.columns where table_name = 'users' and column_name = 'status'"
  );
  const hasStatus = colsStatusRes.rowCount > 0;
  const avatarColumn = await resolveUserColumnAlias('avatar_url', ['avatar_url', 'avatarUrl', 'avatarurl']);
  const avatarBlobColumn = await resolveUserColumnAlias('avatar_data', ['avatar_data', 'avatarData']);
  // Prefer a unified view `users_full` when it exists (provides roles array and profile JSONB)
  try {
    const viewCheck = await pool.query("select to_regclass('public.users_full') as reg");
    const hasUsersFull = Boolean(viewCheck.rows[0] && viewCheck.rows[0].reg);
    if (hasUsersFull) {
      const viewWhereClauses: string[] = [];
      const viewWhereVals: any[] = [];
      let viewIdx = 1;
      if (filters?.email) { viewWhereClauses.push(`uf.email ILIKE $${viewIdx++}`); viewWhereVals.push(`%${filters.email}%`); }
      if (filters?.role) { viewWhereClauses.push(`(uf.role = $${viewIdx} OR uf.roles @> ARRAY[$${viewIdx}]::text[])`); viewWhereVals.push(filters.role); viewIdx++; }
      if (filters?.status && hasStatus) { viewWhereClauses.push(`uf.status = $${viewIdx++}`); viewWhereVals.push(filters.status); }
      const viewWhereClause = viewWhereClauses.length ? `WHERE ${viewWhereClauses.join(' AND ')}` : '';
      const avatarSelect = avatarColumn ? `, u.${quoteIdentifier(avatarColumn)} as avatarUrl` : '';
      const avatarBlobSelect = avatarBlobColumn ? `, u.${quoteIdentifier(avatarBlobColumn)} IS NOT NULL as hasAvatarBlob` : '';
      const avatarJoin = avatarColumn || avatarBlobColumn ? ' LEFT JOIN users u ON u.id = uf.id' : '';
      const qv = `
        SELECT uf.id, uf.name, uf.email, uf.role, uf.created_at,
          uf.status, uf.permissions, uf.roles as roles_arr, uf.profile${avatarSelect}${avatarBlobSelect}
        FROM users_full uf
        ${avatarJoin}
        ${viewWhereClause}
        ORDER BY uf.created_at DESC
        LIMIT $${viewIdx} OFFSET $${viewIdx + 1}
      `;
      const rv = await pool.query(qv, [...viewWhereVals, limit, offset]);
      const rows = rv.rows.map((r: any) => {
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
          avatarUrl: r.avatarUrl ?? undefined,
        };
        if (!out.avatarUrl && r.hasAvatarBlob) {
          out.avatarUrl = `/api/users/avatar?id=${r.id}`;
        }
        applyAvatarFallbackFromProfile(out);
        return out;
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
  } catch (e) {
    // if view check fails, fall back to regular query below
  }

  // detect whether the user_profile table exists to avoid referencing it in SQL when absent
  const profileTableRes = await pool.query("select to_regclass('public.user_profile') as reg");
  const hasUserProfile = Boolean(profileTableRes.rows[0] && profileTableRes.rows[0].reg);

  const avatarParts = buildAvatarSelectForList(avatarColumn);
  const avatarSelect = avatarParts.select;
  const avatarGroup = avatarParts.group;
  const avatarBinaryParts = buildAvatarBinaryFlag(avatarBlobColumn);
  const avatarBinarySelect = avatarBinaryParts.select;
  const avatarBinaryGroup = avatarBinaryParts.group;

  const selectExtra = `${hasStatus ? ', u.status' : ''}${hasPerm ? ', u.permissions' : ''}`;

  const profileSelect = hasUserProfile
    ? `(SELECT CASE WHEN up.phone IS NULL AND up.extra IS NULL THEN NULL ELSE COALESCE(up.extra, '{}'::jsonb) || CASE WHEN up.phone IS NOT NULL THEN jsonb_build_object('phone', up.phone) ELSE '{}'::jsonb END END FROM user_profile up WHERE up.user_id = u.id::text LIMIT 1) as profile`
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
    SELECT u.id, u.name, u.email, u.role, u.created_at${selectExtra}${avatarSelect}${avatarBinarySelect},
      COALESCE(jsonb_agg(DISTINCT jsonb_build_object('name', r.name)) FILTER (WHERE r.name IS NOT NULL), '[]') as roles_agg,
      ${profileSelect}
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id::text
    LEFT JOIN roles r ON r.id::text = ur.role_id
    ${whereClause}
    GROUP BY u.id, u.name, u.email, u.role, u.created_at${hasStatus ? ', u.status' : ''}${hasPerm ? ', u.permissions' : ''}${avatarGroup}${avatarBinaryGroup}
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
    if (!r.avatarUrl && r.hasAvatarBlob) {
      r.avatarUrl = `/api/users/avatar?id=${r.id}`;
    }
    delete r.hasAvatarBlob;
    applyAvatarFallbackFromProfile(r);
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
    let columnName = k;
    const candidates = userColumnAliasCandidates[k];
    if (candidates) {
      const resolved = await resolveUserColumnAlias(k, candidates);
      if (!resolved) {
        continue;
      }
      columnName = resolved;
    }
    sets.push(`${columnName} = $${idx}`);
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

export async function updateUserProfilePreferences(userId: string, updates: UserProfilePreferences) {
  if (!updates || typeof updates !== 'object') return;
  const meta = await ensureUserProfileMetadata();
  if (!meta.exists) return;

  const hasPhoneField = updates.phone !== undefined;
  const normalizedPhone =
    hasPhoneField && updates.phone !== null
      ? String(updates.phone).trim()
      : updates.phone === null
        ? null
        : undefined;
  const phoneValue = normalizedPhone === '' ? null : normalizedPhone;

  const patch: Record<string, any> = {};
  if (meta.hasExtra) {
    if (updates.hasWhatsapp !== undefined) {
      patch.has_whatsapp = updates.hasWhatsapp;
    }
    if (updates.whatsappNotifications !== undefined) {
      patch.whatsapp_notifications = updates.whatsappNotifications;
    }
    if (updates.avatarUrl !== undefined) {
      patch.avatar_url = updates.avatarUrl;
    }
  }
  const hasPhoneUpdate = hasPhoneField && meta.hasPhone;

  if (!Object.keys(patch).length && !hasPhoneUpdate) {
    return;
  }

  const insertColumns = ['user_id'];
  const insertPlaceholders = ['$1::text'];
  const insertValues: any[] = [String(userId)];
  if (meta.hasExtra) {
    const nextIndex = insertValues.length + 1;
    insertColumns.push('extra');
    insertPlaceholders.push(`$${nextIndex}::jsonb`);
    insertValues.push('{}');
  }

  await pool.query(
    `INSERT INTO user_profile (${insertColumns.join(', ')})
     VALUES (${insertPlaceholders.join(', ')})
     ON CONFLICT (user_id) DO NOTHING`,
    insertValues
  );

  const updateParts: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (meta.hasExtra && Object.keys(patch).length) {
    updateParts.push(`extra = COALESCE(extra, '{}'::jsonb) || $${idx}::jsonb`);
    values.push(JSON.stringify(patch));
    idx++;
  }
  if (hasPhoneUpdate) {
    updateParts.push(`phone = $${idx}`);
    values.push(phoneValue === undefined ? null : phoneValue);
    idx++;
  }

  if (!updateParts.length) return;

  const updateClauseParts = [...updateParts];
  if (meta.hasUpdatedAt) {
    updateClauseParts.push('updated_at = NOW()');
  }

  const query = `UPDATE user_profile SET ${updateClauseParts.join(', ')} WHERE user_id = $${idx}`;
  values.push(String(userId));
  await pool.query(query, values);
}

// Per-user dashboard widgets stored under user_profile.extra -> dashboard_widgets
export async function getUserDashboardWidgets(userId: string) {
  const meta = await ensureUserProfileMetadata();
  if (!meta.exists || !meta.hasExtra) return null;
  try {
    const res = await pool.query("select extra from user_profile where user_id = $1 limit 1", [String(userId)]);
    if (!res.rowCount) return null;
    const extra = res.rows[0].extra;
    if (!extra) return null;
    return extra.dashboard_widgets ?? null;
  } catch (e) {
    return null;
  }
}

export async function setUserDashboardWidgets(userId: string, widgets: Record<string, any>) {
  if (!widgets || typeof widgets !== 'object') return;
  const meta = await ensureUserProfileMetadata();
  if (!meta.exists) return;
  // merge dashboard_widgets into extra JSONB
  try {
    await pool.query(
      `INSERT INTO user_profile (user_id, extra) VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET extra = COALESCE(user_profile.extra, '{}'::jsonb) || $2::jsonb`,
      [String(userId), JSON.stringify({ dashboard_widgets: widgets })]
    );
  } catch (e) {
    // ignore
  }
}
