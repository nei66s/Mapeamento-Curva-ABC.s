import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, issueAccessToken, issueRefreshToken } from '@/lib/auth/jwt';
import { validateRefreshToken, saveRefreshToken, invalidateRefreshToken } from '@/server/adapters/refresh-tokens-adapter';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) return NextResponse.json({ message: 'missing' }, { status: 400 });
    const verified = verifyRefreshToken(refreshToken);
    if (!verified.valid) return NextResponse.json({ message: 'invalid' }, { status: 401 });
    const saved = await validateRefreshToken(refreshToken);
    if (!saved) return NextResponse.json({ message: 'invalid' }, { status: 401 });

    // issue new tokens
    const accessToken = issueAccessToken(saved.user_id || saved.userId || verified.userId || verified.userId);
    const newRefresh = issueRefreshToken(saved.user_id || saved.userId || verified.userId || verified.userId);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    await invalidateRefreshToken(refreshToken);
    await saveRefreshToken(saved.user_id, newRefresh, expiresAt);

    const res = NextResponse.json({ accessToken, refreshToken: newRefresh, expiresIn: 3600 });
    res.cookies.set('pm_access_token', accessToken, { httpOnly: false, path: '/', sameSite: 'lax' });
    res.cookies.set('pm_refresh_token', newRefresh, { httpOnly: true, path: '/', sameSite: 'lax' });
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'error' }, { status: 500 });
  }
}
