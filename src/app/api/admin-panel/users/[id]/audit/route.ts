import { auditLogs } from '../../../_data';
import { isModuleActive, json } from '../../../_utils';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const logs = auditLogs.filter((log) => log.entityId === params.id || log.userId === params.id);
  return json(logs);
}
