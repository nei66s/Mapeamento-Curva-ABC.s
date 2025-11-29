import { NextRequest, NextResponse } from 'next/server';
import { getTimeseries } from '@/server/adapters/metrics-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  // Accept either `key` or `route` for backwards compatibility with the client
  const key = request.nextUrl.searchParams.get('key') || request.nextUrl.searchParams.get('route') || '';
  if (!key) {
    // Client sometimes calls timeseries without a specific key; return an empty array
    return NextResponse.json([]);
  }
  const rows = await getTimeseries(key);
  return NextResponse.json(rows);
}
