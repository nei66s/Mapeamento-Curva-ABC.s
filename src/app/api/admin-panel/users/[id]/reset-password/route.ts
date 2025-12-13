export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../../../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import { getUserById, updateUser } from '@/server/adapters/users-adapter';
import { logAudit } from '@/server/adapters/audit-adapter';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const mod = await getModuleByKey('admin-users');
  if (mod && !mod.is_active) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const user = await getUserById(id);
  if (!user) return json({ message: 'Usuário não encontrado.' }, 404);

  // generate a temporary password and persist its hash
  const provisionalPassword = randomBytes(9).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').slice(0, 12);
  const hash = bcrypt.hashSync(provisionalPassword, 10);
  try {
    await updateUser(id, { password_hash: hash });
    await logAudit({ user_id: 'u-admin', entity: 'user', entity_id: id, action: 'user.reset-password', before_data: null, after_data: { passwordReset: true }, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
  } catch (e) {
    return json({ message: 'Erro ao resetar senha' }, 500);
  }

  return json({ success: true, temporaryPassword: provisionalPassword });
}
