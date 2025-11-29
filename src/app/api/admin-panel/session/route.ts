import { NextRequest, NextResponse } from 'next/server';
import { adminUsers, featureFlags, verifyAccessToken } from '../_data';
import { cloneDefaultPermissions } from '@/lib/permissions-config';
import { buildActiveModulesMap } from '../_utils';
import type { AdminSession } from '@/types/admin';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('pm_access_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }
  const verified = verifyAccessToken(accessToken);
  if (!verified.valid) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }
  const user = adminUsers.find((u) => u.id === verified.userId);
  if (!user) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const permsMap = cloneDefaultPermissions();
  const roleKey = (verified.role ?? user.role) as keyof typeof permsMap;
  const rolePerms = permsMap[roleKey] ?? {};
  const permissions: Record<string, boolean> = { ...rolePerms };

  const activeModules = buildActiveModulesMap();
  const flags = Object.fromEntries(featureFlags.map((f) => [f.key, Boolean(f.enabled)]));

  const session: AdminSession = {
    user: { id: user.id, email: user.email, role: user.role },
    permissions,
    activeModules,
    featureFlags: flags,
  };

  const hasAdminAccess = permissions['admin-dashboard'] ?? false;
  if (!hasAdminAccess) {
    return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
  }

  return NextResponse.json(session);
}
