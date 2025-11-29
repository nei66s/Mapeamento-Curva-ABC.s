import { NextRequest } from 'next/server';
import { json } from '../admin-panel/_utils';
import { systemConfig, setSystemConfig, recordAudit } from '../admin-panel/_data';
import { getRequestIp } from '../admin-panel/_utils';

export async function GET() {
  return json(systemConfig);
}

export async function PUT(request: NextRequest) {
  if (!systemConfig) return json({ message: 'Configuração não encontrada.' }, 404);
  const body = await request.json();
  const before = { ...systemConfig };
  const updated = setSystemConfig({ ...systemConfig, ...(body || {}) });
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
  return json(updated);
}
