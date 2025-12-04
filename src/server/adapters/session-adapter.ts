import { getUserById } from './users-adapter';
import { getRolePermissions, getRoleByName } from './roles-adapter';
import { getActiveModules } from './modules-adapter';
import { listFlags } from './feature-flags-adapter';
import pool from '@/lib/db';

// Retorna AdminSession no formato correto:
// {
//   user: { id, email, role },
//   permissions: Record<string, boolean>,
//   activeModules: Record<string, boolean>,
//   featureFlags: Record<string, boolean>
// }
export async function buildAdminSession(userId: string) {
  const user = await getUserById(userId);
  if (!user) return null;

  // Permissions → map
  // user.role may be stored as role id (uuid) or as role name.
  // First, prefer per-user permissions if present (new `users.permissions` JSONB column)
  let permissions: Record<string, boolean> = {};
  if ((user as any).permissions) {
    const up = (user as any).permissions;
    if (Array.isArray(up)) {
      for (const k of up) permissions[k] = true;
    } else if (typeof up === 'object') {
      for (const [k, v] of Object.entries(up)) permissions[k] = Boolean(v);
    }
  } else {
    let roleId = user.role || '';
    // crude UUID v4 pattern
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (roleId && !uuidLike.test(roleId)) {
      const r = await getRoleByName(roleId);
      roleId = r ? r.id : '';
    }
    const permList = await getRolePermissions(roleId || '');
    for (const key of permList) permissions[key] = true;
  }

  // Active modules → map (tolerant to missing modules table)
  let activeModules: Record<string, boolean> = {};
  // Modules metadata map (includes visibility/beta flags)
  let modulesMap: Record<string, any> | undefined = undefined;
  try {
    const moduleRows = await getActiveModules();
    activeModules = {};
    for (const m of moduleRows) {
      if (m && m.key) activeModules[m.key] = true;
    }
    // Try to also fetch full modules list if available (to expose visibleInMenu and beta)
    try {
      // lazy import listModules to avoid cycles
      const { listModules } = await import('./modules-adapter');
      const all = await listModules();
      modulesMap = {};
      for (const mm of all || []) {
        if (mm && mm.key) modulesMap[mm.key] = mm;
      }
    } catch (e) {
      modulesMap = undefined;
    }
  } catch (e) {
    // ignore and fallback to empty modules
    // eslint-disable-next-line no-console
    console.debug('buildAdminSession: getActiveModules failed, continuing with empty set', e && (e as any).message ? (e as any).message : e);
    activeModules = {};
  }

  // Flags → map
  // Flags → map (tolerant to missing feature_flags table)
  const featureFlags: Record<string, boolean> = {};
  try {
    const flags = await listFlags();
    for (const f of flags) {
      if (f && f.key) featureFlags[f.key] = Boolean(f.enabled);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug('buildAdminSession: listFlags failed, continuing with empty set', e && (e as any).message ? (e as any).message : e);
  }

  // Dashboard settings (optional)
  let dashboardSettings: any = null;
  try {
    // admin_dashboard_settings stores key, value (json)
    // be tolerant if table or key missing
    const res = await pool.query("select value from admin_dashboard_settings where key = $1 limit 1", ['dashboard_widgets']);
    if (res.rowCount) {
      try {
        dashboardSettings = JSON.parse(res.rows[0].value);
      } catch (e) {
        dashboardSettings = res.rows[0].value;
      }
    }
  } catch (e) {
    // ignore: optional feature
    // eslint-disable-next-line no-console
    console.debug('buildAdminSession: admin_dashboard_settings missing or unreadable', e && (e as any).message ? (e as any).message : e);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    permissions,
    activeModules,
    modules: modulesMap,
    featureFlags,
    dashboardSettings,
  };
}
