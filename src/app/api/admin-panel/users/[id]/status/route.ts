import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../../../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import { getUserById, updateUser } from '@/server/adapters/users-adapter';
import { logAudit } from '@/server/adapters/audit-adapter';

export async function POST(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const mod = await getModuleByKey('admin-users');
  if (mod && !mod.is_active) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const body = await request.json();
  const user = await getUserById(id);
  if (!user) return json({ message: 'Usuário não encontrado.' }, 404);
  const updated = await updateUser(id, { status: body.status } as any);
  try {
    await logAudit({ user_id: body.actorId || 'u-admin', entity: 'user', entity_id: id, action: `user.${body.status}`, before_data: user, after_data: updated, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
  } catch (e) {}
  return json(updated);
}
