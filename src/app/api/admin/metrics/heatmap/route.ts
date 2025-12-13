export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });

  // Simple heatmap: counts per hour for last 24 hours grouped by route
  const sql = `
    select date_trunc('hour', created_at) as hour, route, count(*) as hits
    from tracking_events
    where created_at >= now() - interval '24 hours'
    group by hour, route
    order by hour desc
  `;
  const res = await pool.query(sql);
  // Return raw array for heatmap data (client expects array)
  return NextResponse.json(res.rows);
}
