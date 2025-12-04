import { NextResponse } from 'next/server';
import { listModules } from '@/server/adapters/modules-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: Request) {
  try {
    // Read token from cookie or Authorization header
    const cookieHeader = request.headers.get('cookie') || '';
    const pmCookie = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('pm_access_token='));
    const cookieToken = pmCookie ? pmCookie.split('=')[1] : undefined;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken || '';

    const verified = verifyAccessToken(token as string);
    if (!verified || !verified.valid) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
    }

    const rows = await listModules();
    return NextResponse.json({ ok: true, result: rows });
  } catch (err: any) {
    console.error('[GET /api/admin/modules] error', err && err.stack ? err.stack : err);
    return NextResponse.json({ ok: false, error: (err && err.message) || String(err) }, { status: 500 });
  }
}
