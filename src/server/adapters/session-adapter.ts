import { getUserById } from './users-adapter';
import { getRolePermissions, getRoleByName } from './roles-adapter';
import { getActiveModules } from './modules-adapter';
import { listFlags } from './feature-flags-adapter';

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

  // Active modules → map
  const moduleRows = await getActiveModules();
  const activeModules: Record<string, boolean> = {};
  for (const m of moduleRows) activeModules[m.key] = true;

  // Flags → map
  const flags = await listFlags();
  const featureFlags: Record<string, boolean> = {};
  for (const f of flags) featureFlags[f.key] = Boolean(f.enabled);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    permissions,
    activeModules,
    featureFlags,
  };
}
