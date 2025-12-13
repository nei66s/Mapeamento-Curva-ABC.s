export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import { logAudit } from '@/server/adapters/audit-adapter';
import { listRoles, createOrUpdateRole } from '@/server/adapters/roles-adapter';

export async function GET() {
  const mod = await getModuleByKey('admin-roles');
  if (mod && !mod.is_active) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const r = await listRoles();
  return json(r);
}

export async function POST(request: NextRequest) {
  const mod = await getModuleByKey('admin-roles');
  if (mod && !mod.is_active) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const body = await request.json();
  try {
    const role = await createOrUpdateRole({ name: body.name, description: body.description, permissions: body.permissions || [] });
    try {
      await logAudit({ user_id: body.actorId || 'u-admin', entity: 'role', entity_id: String(role.id), action: 'role.create', before_data: null, after_data: role, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
    } catch (e) {}
    return json(role, 201);
  } catch (err: any) {
    // log server-side for debugging (do not expose stack to clients)
    // eslint-disable-next-line no-console
    console.error('admin-panel/roles POST error', err && err.message ? err.message : err, err && err.stack ? err.stack : '');
    return json({ message: (err && err.message) || 'Erro ao criar papel' }, 500);
  }
}
