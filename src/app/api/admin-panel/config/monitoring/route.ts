import { NextRequest } from 'next/server';
import { recordAudit, systemConfig } from '../../_data';
import { isModuleActive, json, getRequestIp } from '../../_utils';

export async function POST(request: NextRequest) {
  if (!isModuleActive('admin-config')) return json({ message: 'Módulo de config inativo.' }, 403);
  const body = await request.json();
  const before = { ...systemConfig.monitoring };
  systemConfig.monitoring = body.monitoring || before;
  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'config',
    entityId: 'monitoring',
    action: 'config.monitoring.update',
    before,
    after: systemConfig.monitoring,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
  return json(systemConfig);
}
