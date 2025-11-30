import { json } from '../../../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import pool from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const mod = await getModuleByKey('admin-users');
  if (mod && !mod.is_active) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const res = await pool.query('select id, user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at from audit_logs where entity_id = $1 or user_id::text = $1 order by created_at desc limit 200', [params.id]);
  return json(res.rows);
}
