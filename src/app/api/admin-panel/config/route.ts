import { NextRequest } from 'next/server';
import { recordAudit, systemConfig, setSystemConfig } from '../_data';
import { isModuleActive, json, getRequestIp } from '../_utils';

export async function GET() {
  if (!isModuleActive('admin-config')) return json({ message: 'Módulo de config inativo.' }, 403);
  return json(systemConfig);
}

export async function PUT(request: NextRequest) {
  if (!isModuleActive('admin-config')) return json({ message: 'Módulo de config inativo.' }, 403);
  const body = await request.json();
  const before = { ...systemConfig };
  const updated = { ...systemConfig, ...body };
  setSystemConfig(updated);
  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'config',
    entityId: 'system',
    action: 'config.update',
    before,
    after: updated,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
  return json(systemConfig);
}
