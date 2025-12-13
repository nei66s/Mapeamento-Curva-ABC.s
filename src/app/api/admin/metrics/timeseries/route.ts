export const runtime = 'nodejs';

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
  // Normalize rows: if the adapter stored a single row with a jsonb `metric_value` containing the series,
  // return that inner array to match client expectation (TimeSeriesPoint[]).
  if (Array.isArray(rows) && rows.length === 1 && rows[0] && rows[0].metric_value) {
    try {
      const mv = rows[0].metric_value;
      // If metric_value is an object with a series array, prefer that; otherwise return as-is if array
      if (Array.isArray(mv)) return NextResponse.json(mv);
      // if it's json object with a `series` or similar, try to extract
      if (mv && typeof mv === 'object') {
        if (Array.isArray(mv.series)) return NextResponse.json(mv.series);
      }
    } catch (e) {
      // fallthrough to returning rows
    }
  }
  return NextResponse.json(rows);
}
