import { NextRequest } from 'next/server';
import { recordAudit } from '../../../_data';
import { isModuleActive, json, getRequestIp } from '../../../_utils';
import { getRoleById, updateRoleById } from '@/server/adapters/roles-adapter';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-roles')) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const body = await request.json();
  const before = await getRoleById(params.id);
  if (!before) return json({ message: 'Papel não encontrado.' }, 404);
  const updated = await updateRoleById(params.id, { permissions: body.permissions || [] });

  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'role',
    entityId: params.id,
    action: 'role.permissions.update',
    before,
    after: updated || null,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json(updated || {});
}
