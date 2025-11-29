import { NextRequest } from 'next/server';
import { adminUsers, recordAudit } from '../../../_data';
import { isModuleActive, json } from '../../../_utils';
import { getRequestIp } from '../../../_utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const user = adminUsers.find((u) => u.id === params.id);
  if (!user) return json({ message: 'Usuário não encontrado.' }, 404);

  recordAudit({
    userId: 'u-admin',
    userName: 'Sistema',
    entity: 'user',
    entityId: params.id,
    action: 'user.reset-password',
    before: null,
    after: { passwordReset: true },
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json({ success: true, temporaryPassword: 'NovaSenha!234' });
}
