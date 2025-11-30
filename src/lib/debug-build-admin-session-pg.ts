import { Pool } from 'pg';

function resolvePassword() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    if (!process.env.PGPASSWORD) throw new Error('PGPASSWORD not set');
    return process.env.PGPASSWORD;
  }
  if (!process.env.PGPASSWORD) {
    const allowDefault = String(process.env.DEV_ALLOW_DEFAULT_PG_PASSWORD || '').toLowerCase() === 'true';
    if (allowDefault) {
      console.warn("DEV_ALLOW_DEFAULT_PG_PASSWORD=true — using 'admin' fallback for development only.");
      return 'admin';
    }
    throw new Error('PGPASSWORD not set.');
  }
  return process.env.PGPASSWORD as string;
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'mapeamento_user',
        password: resolvePassword(),
        database: process.env.PGDATABASE || 'mapeamento',
      }
);

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

run();
