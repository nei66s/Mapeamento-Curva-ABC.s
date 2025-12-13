export const runtime = 'nodejs';

import { json, getRequestIp } from '../../_utils';
import { NextRequest } from 'next/server';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import { logAudit } from '@/server/adapters/audit-adapter';
import { getRoleById, updateRoleById, deleteRoleById } from '@/server/adapters/roles-adapter';

export async function GET(_: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const mod = await getModuleByKey('admin-roles');
  if (mod && !mod.is_active) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const role = await getRoleById(id);
  if (!role) return json({ message: 'Papel não encontrado.' }, 404);
  return json(role);
}

export async function PUT(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const mod = await getModuleByKey('admin-roles');
  if (mod && !mod.is_active) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const body = await request.json();
  const before = await getRoleById(id);
  if (!before) return json({ message: 'Papel não encontrado.' }, 404);
  const updated = await updateRoleById(id, { name: body.name, description: body.description, permissions: body.permissions });
  try {
    await logAudit({ user_id: body.actorId || 'u-admin', entity: 'role', entity_id: id, action: 'role.update', before_data: before, after_data: updated, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
  } catch (e) {}
  return json(updated);
}

export async function DELETE(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const mod = await getModuleByKey('admin-roles');
  if (mod && !mod.is_active) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const before = await getRoleById(id);
  if (!before) return json({ message: 'Papel não encontrado.' }, 404);
  await deleteRoleById(id);
  try {
    await logAudit({ user_id: 'u-admin', entity: 'role', entity_id: id, action: 'role.delete', before_data: before, after_data: null, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
  } catch (e) {}
  return json({ success: true });
}
