import { NextRequest } from 'next/server';
import { recordAudit } from '../../_data';
import { isModuleActive, json, getRequestIp } from '../../_utils';
import { getUserById, updateUser as updateUserAdapter } from '@/server/adapters/users-adapter';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const user = await getUserById(params.id);
  if (!user) return json({ message: 'Usuário não encontrado.' }, 404);
  return json(user);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const body = await request.json();
  const existing = await getUserById(params.id);
  if (!existing) return json({ message: 'Usuário não encontrado.' }, 404);
  const updated = await updateUserAdapter(params.id, { name: body.name, email: body.email, role: body.role, password_hash: body.password_hash ?? undefined });
  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'user',
    entityId: params.id,
    action: 'user.update',
    before: existing,
    after: updated,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json(updated);
}
