import { NextRequest } from 'next/server';
import { recordAudit } from '../_data';
import { isModuleActive, json, getRequestIp } from '../_utils';
import { listRoles, createOrUpdateRole } from '@/server/adapters/roles-adapter';

export async function GET() {
  if (!isModuleActive('admin-roles')) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const r = await listRoles();
  return json(r);
}

export async function POST(request: NextRequest) {
  if (!isModuleActive('admin-roles')) return json({ message: 'Módulo de papéis inativo.' }, 403);
  const body = await request.json();
  try {
    const role = await createOrUpdateRole({ name: body.name, description: body.description, permissions: body.permissions || [] });
    recordAudit({
      userId: body.actorId || 'u-admin',
      userName: body.actorName || 'Sistema',
      entity: 'role',
      entityId: String(role.id),
      action: 'role.create',
      before: null,
      after: role,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });
    return json(role, 201);
  } catch (err: any) {
    // log server-side for debugging (do not expose stack to clients)
    // eslint-disable-next-line no-console
    console.error('admin-panel/roles POST error', err && err.message ? err.message : err, err && err.stack ? err.stack : '');
    return json({ message: (err && err.message) || 'Erro ao criar papel' }, 500);
  }
}
