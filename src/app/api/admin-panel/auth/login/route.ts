import { NextRequest, NextResponse } from 'next/server';
import { adminUsers, recordAudit, issueAccessToken, issueRefreshToken } from '../../_data';
import { json, getRequestIp } from '../../_utils';

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Credenciais obrigatórias.' }, { status: 400 });
  }

  const user = adminUsers.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 401 });
  if (user.status === 'blocked') {
    return NextResponse.json({ message: 'Usuário bloqueado.' }, { status: 403 });
  }
  // Mock password check; for real backends, validate hash server-side.
  if (password !== DEFAULT_PASSWORD) {
    return NextResponse.json({ message: 'Senha inválida.' }, { status: 401 });
  }

  const accessToken = issueAccessToken(user.id, user.role);
  const refreshToken = issueRefreshToken(user.id);

  const res = NextResponse.json({
    user,
    accessToken,
    refreshToken,
    expiresIn: 3600,
  });

  res.cookies.set('pm_access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
  });
  res.cookies.set('pm_refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  recordAudit({
    userId: user.id,
    userName: user.name,
    entity: 'auth',
    entityId: user.id,
    action: 'login',
    before: null,
    after: { success: true },
      ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return res;
}
