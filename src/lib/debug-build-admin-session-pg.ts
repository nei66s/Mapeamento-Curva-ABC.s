import { Pool } from 'pg';

// Use DATABASE_URL where possible; avoid referencing PGHOST/PGUSER/PGPASSWORD/PGPORT
// directly. This helper is for local debugging only and will refuse to run in
// production without DATABASE_URL.
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL not set. debug-build-admin-session-pg requires DATABASE_URL in production.');
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ connectionString: 'postgres://mapeamento_user:admin@localhost:5432/mapeamento' });

async function run() {
  try {
    const userRes = await pool.query('select id, email, role from users where email = $1 limit 1', ['admin@gmail.com']);
    if (userRes.rowCount === 0) {
      console.log('admin not found');
      return;
    }
    const user = userRes.rows[0];
    console.log('user:', user);

    // Resolve role id: user.role may be a name or an id
    let roleId = user.role;
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (roleId && !uuidLike.test(roleId)) {
      const r = await pool.query('select id from roles where name = $1 limit 1', [roleId]);
      roleId = r.rowCount ? r.rows[0].id : null;
    }

    // permissions
    const permRes = await pool.query(
      `select p.key as permission_key
       from role_permissions rp
       join permissions p on p.id = rp.permission_id
       where rp.role_id = $1`,
      [roleId]
    );
    const permissions: Record<string, boolean> = {};
    for (const r of permRes.rows) permissions[r.permission_key] = true;

    // active modules
    const modRes = await pool.query('select key from modules where is_active = true');
    const activeModules: Record<string, boolean> = {};
    for (const m of modRes.rows) activeModules[m.key] = true;

    // flags
    const flagRes = await pool.query('select key, enabled from feature_flags');
    const featureFlags: Record<string, boolean> = {};
    for (const f of flagRes.rows) featureFlags[f.key] = Boolean(f.enabled);

    const session = {
      user: { id: user.id, email: user.email, role: user.role },
      permissions,
      activeModules,
      featureFlags,
    };

    console.log('built session:', JSON.stringify(session, null, 2));
  } catch (err) {
    console.error('error building session via pg:', err);
  } finally {
    await pool.end();
  }
}

// Only execute this helper script when explicitly enabled to avoid accidental
// execution during Next.js builds or when the module is imported by other code.
if (process.env.DEBUG_BUILD_ADMIN_SESSION === 'true' && process.env.NODE_ENV !== 'production') {
  run();
}
