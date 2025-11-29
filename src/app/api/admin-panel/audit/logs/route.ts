import { NextRequest } from 'next/server';
import { isModuleActive, json, parsePagination } from '../../_utils';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!(await isModuleActive('admin-audit'))) return json({ message: 'Módulo de auditoria inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams, 20);
  const userId = searchParams.get('userId');
  const entity = searchParams.get('entity');
  const action = searchParams.get('action');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const wheres: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  if (userId) { wheres.push(`user_id::text = $${idx}`); vals.push(userId); idx++; }
  if (entity) { wheres.push(`entity = $${idx}`); vals.push(entity); idx++; }
  if (action) { wheres.push(`action = $${idx}`); vals.push(action); idx++; }
  if (from) { wheres.push(`created_at >= $${idx}`); vals.push(from); idx++; }
  if (to) { wheres.push(`created_at <= $${idx}`); vals.push(to); idx++; }
  const whereSql = wheres.length ? `where ${wheres.join(' and ')}` : '';

  const offset = (page - 1) * pageSize;
  const q = `select id, user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at from audit_logs ${whereSql} order by created_at desc limit $${idx} offset $${idx + 1}`;
  vals.push(pageSize, offset);
  const res = await pool.query(q, vals);
  const totalRes = await pool.query(`select count(*)::int as c from audit_logs ${whereSql}`, vals.slice(0, idx - 1));
  const total = totalRes.rows[0] ? Number(totalRes.rows[0].c || 0) : 0;
  return json({ items: res.rows, total, page, pageSize });
}
