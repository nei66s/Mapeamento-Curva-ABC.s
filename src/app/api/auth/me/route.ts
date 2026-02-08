export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/server/adapters/users-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('pm_access_token')?.value;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '') || null;
    const token = cookieToken || headerToken;
    if (!token) {
      console.debug('[auth/me] missing token; cookiePresent=', !!cookieToken, 'authHeaderPresent=', !!headerToken);
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
    }
    const verified = verifyAccessToken(token);
    if (!verified.valid) {
      console.debug('[auth/me] invalid token');
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
    }
    const user = await getUserById(verified.userId);
    if (!user) return NextResponse.json({ message: 'not found' }, { status: 404 });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err: any) {
    console.error('[auth/me] unexpected error', err);
    return NextResponse.json({ message: err?.message || 'error' }, { status: 500 });
  }
}
