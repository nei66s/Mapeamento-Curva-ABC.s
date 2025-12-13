export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { json, parsePagination } from '../../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const mod = await getModuleByKey('admin-analytics');
  if (mod && !mod.is_active) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams, 15);
  const route = searchParams.get('route');
  const userId = searchParams.get('userId');
  const device = searchParams.get('device');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Build WHERE clauses for tracking_events
  const wheres: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  if (route) { wheres.push(`route = $${idx}`); vals.push(route); idx++; }
  if (userId) { wheres.push(`user_id::text = $${idx}`); vals.push(userId); idx++; }
  if (device) { wheres.push(`device = $${idx}`); vals.push(device); idx++; }
  if (from) { wheres.push(`created_at >= $${idx}`); vals.push(from); idx++; }
  if (to) { wheres.push(`created_at <= $${idx}`); vals.push(to); idx++; }
  const whereSql = wheres.length ? `where ${wheres.join(' and ')}` : '';

  const offset = (page - 1) * pageSize;
  const q = `select id, route, user_id, device, created_at from tracking_events ${whereSql} order by created_at desc limit $${idx} offset $${idx + 1}`;
  vals.push(pageSize, offset);
  const res = await pool.query(q, vals);
  const totalRes = await pool.query(`select count(*)::int as c from tracking_events ${whereSql}`, vals.slice(0, idx - 1));
  const total = totalRes.rows[0] ? Number(totalRes.rows[0].c || 0) : 0;
  return json({ items: res.rows, total, page, pageSize });
}
