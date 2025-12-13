export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getTrackingStats } from '@/server/adapters/tracking-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const since = Number(request.nextUrl.searchParams.get('minutes') || '60');
  const rows = await getTrackingStats(since);
  return NextResponse.json({ ok: true, result: rows });
}
