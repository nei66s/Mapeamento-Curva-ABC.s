import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../../../_utils';
import { logAudit } from '@/server/adapters/audit-adapter';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import { getRoleById, updateRoleById } from '@/server/adapters/roles-adapter';

export async function POST(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const mod = await getModuleByKey('admin-roles');
  if (mod && !mod.is_active) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const body = await request.json();
  const before = await getRoleById(id);
  if (!before) return json({ message: 'Papel não encontrado.' }, 404);
  const updated = await updateRoleById(id, { permissions: body.permissions || [] });
  try { await logAudit({ user_id: body.actorId || 'u-admin', entity: 'role', entity_id: id, action: 'role.permissions.update', before_data: before, after_data: updated || null, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined }); } catch (e) {}

  return json(updated || {});
}
