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
  const q = `select date_part('hour', created_at)::int as hour, count(*) as cnt from tracking_events ${whereSql} group by hour order by hour`;
  const res = await pool.query(q, vals);
  const buckets: Record<number, number> = {};
  res.rows.forEach((r: any) => { buckets[Number(r.hour)] = Number(r.cnt); });
  const heatmap = Array.from({ length: 24 }).map((_, hour) => ({ hour, count: buckets[hour] || 0 }));
  return json(heatmap);
}
