import { NextRequest } from 'next/server';
import { json } from '../../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const mod = await getModuleByKey('admin-analytics');
  if (mod && !mod.is_active) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const wheres: string[] = [];
  const vals: any[] = [];
  let idx = 1;
  if (from) { wheres.push(`created_at >= $${idx}`); vals.push(from); idx++; }
  if (to) { wheres.push(`created_at <= $${idx}`); vals.push(to); idx++; }
  const whereSql = wheres.length ? `where ${wheres.join(' and ')}` : '';
  const q = `select route, count(*) as count from tracking_events ${whereSql} group by route order by count desc limit 10`;
  const res = await pool.query(q, vals);
  return json(res.rows.map((r: any) => ({ route: r.route, count: Number(r.count) })));
}
