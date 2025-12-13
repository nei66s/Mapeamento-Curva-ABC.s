export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getTrackingStats } from '@/server/adapters/tracking-adapter';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });

  // allow pageSize to limit results
  const q = request.nextUrl.searchParams;
  const pageSize = Math.max(1, Math.min(200, Number(q.get('pageSize') || '10')));

  // tracking-adapter returns routes ordered by hits desc
  const rows = await getTrackingStats();
  // Return raw array (client expects an array of TopRouteStat)
  return NextResponse.json(rows.slice(0, pageSize));
}
