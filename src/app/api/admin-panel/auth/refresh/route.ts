import { NextRequest, NextResponse } from 'next/server';
import { adminUsers, issueAccessToken, verifyRefreshToken } from '../../_data';

export async function POST(request: NextRequest) {
  const { refreshToken: bodyRefreshToken } = await request.json();
  const cookieRefresh = request.cookies.get('pm_refresh_token')?.value;
  const refreshToken = bodyRefreshToken || cookieRefresh;
  if (!refreshToken) return NextResponse.json({ message: 'Refresh token ausente.' }, { status: 401 });

  const verified = verifyRefreshToken(refreshToken);
  if (!verified.valid) return NextResponse.json({ message: 'Token inválido.' }, { status: 401 });
  const user = adminUsers.find((u) => u.id === verified.userId);
  if (!user) return NextResponse.json({ message: 'Token inválido.' }, { status: 401 });

  const accessToken = issueAccessToken(user.id, user.role);
  const res = NextResponse.json({
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user,
  });

  res.cookies.set('pm_access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
  });

  return res;
}
