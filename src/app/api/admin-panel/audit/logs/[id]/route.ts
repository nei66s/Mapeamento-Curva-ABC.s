import { isModuleActive, json } from '../../../_utils';
import pool from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!(await isModuleActive('admin-audit'))) return json({ message: 'Módulo de auditoria inativo.' }, 403);
  const res = await pool.query('select id, user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at from audit_logs where id = $1 limit 1', [params.id]);
  if (!res.rowCount) return json({ message: 'Registro não encontrado.' }, 404);
  return json(res.rows[0]);
}
