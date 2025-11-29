import { NextRequest } from 'next/server';
import { recordAudit, systemConfig, setSystemConfig } from '../../_data';
import { isModuleActive, json, getRequestIp } from '../../_utils';

export async function POST(request: NextRequest) {
  if (!isModuleActive('admin-config')) return json({ message: 'Módulo de config inativo.' }, 403);
  const body = await request.json();
  const before = { ...systemConfig.security };
  const updated = { ...systemConfig, security: body.security || before };
  setSystemConfig(updated);
  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'config',
    entityId: 'security',
    action: 'config.security.update',
    before,
    after: updated.security,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
  return json(systemConfig);
}
