export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { invalidateRefreshToken } from '@/server/adapters/refresh-tokens-adapter';

export async function POST(request: NextRequest) {
  try {
    let refreshToken: string | null = null;
    try {
      const body = await request.json();
      refreshToken = body?.refreshToken ? String(body.refreshToken) : null;
    } catch (e) {
      refreshToken = null;
    }
    // Prefer cookie-based invalidation.
    refreshToken = refreshToken || request.cookies.get('pm_refresh_token')?.value || null;
    if (refreshToken) await invalidateRefreshToken(refreshToken);
    const res = NextResponse.json({ ok: true });
    const common = {
      path: '/',
      maxAge: 0,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    };
    res.cookies.set('pm_access_token', '', { ...common, httpOnly: false });
    res.cookies.set('pm_refresh_token', '', { ...common, httpOnly: true });
    res.cookies.set('pm_user', '', { ...common, httpOnly: true });
    return res;
  } catch (err: any) {
    console.error('[auth/logout] unexpected error', { message: err?.message || String(err) });
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
