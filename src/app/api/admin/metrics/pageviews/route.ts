export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams;
  const page = Math.max(1, Number(q.get('page') || '1'));
  const pageSize = Math.max(1, Math.min(100, Number(q.get('pageSize') || '25')));
  const offset = (page - 1) * pageSize;

  const filters: string[] = [];
  const params: any[] = [];
  let idx = 1;

  const from = q.get('from');
  const to = q.get('to');
  const route = q.get('route');
  const userId = q.get('userId');

  if (from) {
    filters.push(`created_at >= $${idx++}`);
    params.push(from);
  }
  if (to) {
    filters.push(`created_at <= $${idx++}`);
    params.push(to);
  }
  if (route) {
    filters.push(`route = $${idx++}`);
    params.push(route);
  }
  if (userId) {
    filters.push(`user_id = $${idx++}`);
    params.push(userId);
  }

  const where = filters.length ? `where ${filters.join(' and ')}` : '';
  const countSql = `select count(*)::int as total from tracking_events ${where}`;
  const dataSql = `select id, user_id, route, device, browser, created_at from tracking_events ${where} order by created_at desc limit ${pageSize} offset ${offset}`;

  const totalRes = await pool.query(countSql, params);
  const dataRes = await pool.query(dataSql, params);

  // Return paginated object directly (client expects Paginated<PageviewEvent>)
  return NextResponse.json({ items: dataRes.rows, page, pageSize, total: totalRes.rows[0]?.total || 0 });
}
