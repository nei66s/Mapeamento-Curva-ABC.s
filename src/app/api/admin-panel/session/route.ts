import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getUserById } from '@/server/adapters/users-adapter';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
import { getActiveModules } from '@/server/adapters/modules-adapter';
import { listFlags } from '@/server/adapters/feature-flags-adapter';
import type { AdminSession } from '@/types/admin';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('pm_access_token')?.value;
  if (!accessToken) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  const verified = verifyAccessToken(accessToken);
  if (!verified.valid) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  const user = await getUserById(String(verified.userId));
  if (!user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

  const permsMap = cloneDefaultPermissions();
  const roleKey = (verified.role ?? (user as any).role) as keyof typeof permsMap;
  const rolePerms = permsMap[roleKey] ?? {};
  const permissions: Record<string, boolean> = { ...rolePerms };

  const activeModulesList = await getActiveModules();
  const activeModules = Object.fromEntries((activeModulesList || []).map((m: any) => [m.key, true]));
  const flagsList = await listFlags();
  const flags = Object.fromEntries((flagsList || []).map((f: any) => [f.key, Boolean(f.enabled)]));

  const session: AdminSession = {
    user: { id: user.id, email: user.email, role: (user as any).role },
    permissions,
    activeModules,
    featureFlags: flags,
  };

  const hasAdminAccess = permissions['admin-dashboard'] ?? false;
  if (!hasAdminAccess) return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
  return NextResponse.json(session);
}
