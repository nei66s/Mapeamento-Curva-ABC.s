import { NextRequest } from 'next/server';
import { featureModules, recordAudit } from '../../../_data';
import { json, getRequestIp } from '../../../_utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const module = featureModules.find((m) => m.id === params.id);
  if (!module) return json({ message: 'Módulo não encontrado.' }, 404);
  const updated = { ...module, visibleInMenu: Boolean(body.visibleInMenu), updatedAt: new Date().toISOString() };
  featureModules[featureModules.findIndex((m) => m.id === params.id)] = updated;

  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'module',
    entityId: params.id,
    action: 'module.visibility',
    before: module,
    after: updated,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json(updated);
}
