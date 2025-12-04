import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/server/adapters/users-adapter';
import { issueAccessToken, issueRefreshToken } from '@/lib/auth/jwt';
import { logErrorToFile } from '@/server/error-logger';

// Dev-only helper: visit /api/dev/login-as-admin to set session cookies for the admin user
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not-allowed' }, { status: 403 });
  }
  try {
    const email = 'admin@gmail.com';
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'admin user not found' }, { status: 404 });
    }

    const accessToken = issueAccessToken(user.id, user.role || undefined);
    const refreshToken = issueRefreshToken(user.id);

    const res = NextResponse.redirect('/admin-panel/users');
    // set cookies (dev-friendly: not secure)
    res.cookies.set('pm_access_token', accessToken, { httpOnly: true, path: '/', sameSite: 'lax' });
    res.cookies.set('pm_refresh_token', refreshToken, { httpOnly: true, path: '/', sameSite: 'lax' });

    return res;
  } catch (err: any) {
    try { await logErrorToFile({ message: err.message || 'dev login error', stack: err.stack, service: 'dev.login', meta: {} }); } catch (e) {}
    console.error('Dev login error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
