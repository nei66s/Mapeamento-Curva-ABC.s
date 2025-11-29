import { isModuleActive, json, getRequestIp } from '../../_utils';
import { NextRequest } from 'next/server';
import { recordAudit } from '../../_data';
import { getRoleById, updateRoleById, deleteRoleById } from '@/server/adapters/roles-adapter';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-roles')) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const role = await getRoleById(params.id);
  if (!role) return json({ message: 'Papel não encontrado.' }, 404);
  return json(role);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-roles')) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const body = await request.json();
  const before = await getRoleById(params.id);
  if (!before) return json({ message: 'Papel não encontrado.' }, 404);
  const updated = await updateRoleById(params.id, { name: body.name, description: body.description, permissions: body.permissions });
  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'role',
    entityId: params.id,
    action: 'role.update',
    before,
    after: updated,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
  return json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-roles')) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const before = await getRoleById(params.id);
  if (!before) return json({ message: 'Papel não encontrado.' }, 404);
  await deleteRoleById(params.id);
  recordAudit({
    userId: 'u-admin',
    userName: 'Sistema',
    entity: 'role',
    entityId: params.id,
    action: 'role.delete',
    before,
    after: null,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });
  return json({ success: true });
}
