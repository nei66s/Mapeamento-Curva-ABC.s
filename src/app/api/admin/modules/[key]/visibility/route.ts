export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { updateModuleByKey } from '@/server/adapters/modules-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(request: Request, context: { params: any }) {
  try {
    const { key } = context.params as { key: string };
    const cookieHeader = request.headers.get('cookie') || '';
    const pmCookie = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('pm_access_token='));
    const cookieToken = pmCookie ? pmCookie.split('=')[1] : undefined;
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken || '';

    const verified = verifyAccessToken(token as string);
    if (!verified || !verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });

    const body = await request.json();
    const updated = await updateModuleByKey(key, { is_visible: !!body.visible || !!body.visibleInMenu || !!body.visibleInMenu === false ? Boolean(body.visible ?? body.visibleInMenu) : undefined });
    return NextResponse.json({ ok: true, result: updated });
  } catch (err: any) {
    console.error('[POST /api/admin/modules/[key]/visibility] error', err && err.stack ? err.stack : err);
    return NextResponse.json({ ok: false, error: (err && err.message) || String(err) }, { status: 500 });
  }
}
