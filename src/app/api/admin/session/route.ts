export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { buildAdminSession } from '@/server/adapters/session-adapter';

// /api/admin/session
export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get('pm_access_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    const verified = verifyAccessToken(token);
    if (!verified.valid) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const session = await buildAdminSession(verified.userId);
    if (!session) {
      return NextResponse.json({ message: 'user_not_found' }, { status: 404 });
    }

    // Middleware controla permissão — não verificar aqui
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'internal_error' },
      { status: 500 }
    );
  }
}
