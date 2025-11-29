import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/server/adapters/users-adapter';
import bcrypt from 'bcryptjs';
import { issueAccessToken, issueRefreshToken } from '@/lib/auth/jwt';
import { saveRefreshToken } from '@/server/adapters/refresh-tokens-adapter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ message: 'missing credentials' }, { status: 400 });
    }

    const user = await getUserByEmail(String(email).toLowerCase());
    if (!user || !user.password_hash) {
      console.debug('[auth/login] user not found or has no password_hash', { email });
      // Dev-only debug output when requested via header
      if (process.env.NODE_ENV !== 'production' && request.headers.get('x-debug') === 'true') {
        return NextResponse.json({ message: 'invalid credentials', debug: { userFound: !!user, hasPasswordHash: !!(user && (user as any).password_hash) } }, { status: 401 });
      }
      return NextResponse.json({ message: 'invalid credentials' }, { status: 401 });
    }

    const stored = user.password_hash || '';
    let ok = false;
    // If stored password looks like a bcrypt hash, use bcrypt.compare
    if (/^\$2[aby]\$/.test(stored)) {
      ok = await bcrypt.compare(String(password), stored);
    } else {
      // Legacy: stored password may be plaintext (from SQL seed). Accept direct match.
      ok = String(password) === stored;
    }
    if (!ok) {
      console.debug('[auth/login] invalid password for user', { email, userId: user.id });
      if (process.env.NODE_ENV !== 'production' && request.headers.get('x-debug') === 'true') {
        const stored = (user as any).password_hash || '';
        const looksLikeHash = /^\$2[aby]\$/.test(stored);
        return NextResponse.json({ message: 'invalid credentials', debug: { userId: user.id, storedPresent: !!stored, looksLikeHash } }, { status: 401 });
      }
      return NextResponse.json({ message: 'invalid credentials' }, { status: 401 });
    }

    console.debug('[auth/login] login successful', { email, userId: user.id });

    const accessToken = issueAccessToken(user.id, user.role || undefined);
    const refreshToken = issueRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    await saveRefreshToken(user.id, refreshToken, expiresAt);

    // Remove sensitive fields before returning user info
    const { password_hash: _, ...userWithoutPassword } = user as any;

    const res = NextResponse.json(
      {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        expiresIn: 3600,
        message: 'Login bem-sucedido',
      },
      { status: 200 }
    );

    res.cookies.set('pm_access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.cookies.set('pm_refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('[auth/login] unexpected error', err);
    return NextResponse.json({ message: err?.message || 'error' }, { status: 500 });
  }
}
