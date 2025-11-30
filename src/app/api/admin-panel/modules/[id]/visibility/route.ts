import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../../../_utils';
import { getModuleByKey, updateModuleByKey } from '@/server/adapters/modules-adapter';
import { logAudit } from '@/server/adapters/audit-adapter';

export async function POST(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const body = await request.json();
  const currentModule = await getModuleByKey(id);
  if (!currentModule) return json({ message: 'Módulo não encontrado.' }, 404);
  const updated = await updateModuleByKey(id, { is_visible: Boolean(body.visibleInMenu) } as any);

  try {
    await logAudit({ user_id: body.actorId || 'u-admin', entity: 'module', entity_id: id, action: 'module.visibility', before_data: currentModule, after_data: updated, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
  } catch (e) {}

  return json(updated);
}
