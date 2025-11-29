import { NextRequest } from 'next/server';
import { featureModules, recordAudit } from '../../_data';
import { json } from '../../_utils';
import { getRequestIp } from '../../_utils';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const module = featureModules.find((m) => m.id === params.id);
  if (!module) return json({ message: 'Módulo não encontrado.' }, 404);
  const updated = { ...module, ...body, id: params.id, updatedAt: new Date().toISOString() };
  const idx = featureModules.findIndex((m) => m.id === params.id);
  featureModules[idx] = updated;

  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'module',
    entityId: params.id,
    action: 'module.update',
    before: module,
    after: updated,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json(updated);
}
