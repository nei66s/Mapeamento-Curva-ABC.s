import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/server/adapters/users-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    const verified = verifyAccessToken(token);
    if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
    const user = await getUserById(verified.userId);
    if (!user) return NextResponse.json({ message: 'not found' }, { status: 404 });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err: any) {
    console.error('[auth/me] unexpected error', err);
    return NextResponse.json({ message: err?.message || 'error' }, { status: 500 });
  }
}
