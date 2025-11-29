import { NextRequest } from 'next/server';
import { adminUsers, recordAudit, upsertUser } from '../../../_data';
import { isModuleActive, json } from '../../../_utils';
import { getRequestIp } from '../../../_utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const body = await request.json();
  const user = adminUsers.find((u) => u.id === params.id);
  if (!user) return json({ message: 'Usuário não encontrado.' }, 404);
  const updated = { ...user, status: body.status };
  upsertUser(updated);

  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'user',
    entityId: params.id,
    action: `user.${body.status}`,
    before: user,
    after: updated,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json(updated);
}
