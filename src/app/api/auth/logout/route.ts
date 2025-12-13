export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { invalidateRefreshToken } from '@/server/adapters/refresh-tokens-adapter';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (refreshToken) await invalidateRefreshToken(refreshToken);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('pm_access_token', '', { path: '/', maxAge: 0 });
    res.cookies.set('pm_refresh_token', '', { path: '/', maxAge: 0 });
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'error' }, { status: 500 });
  }
}
