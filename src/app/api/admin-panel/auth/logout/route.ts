import { NextResponse } from 'next/server';
import { recordAudit } from '../../_data';

export async function POST() {
  const res = NextResponse.json({ success: true });
  ['pm_access_token', 'pm_refresh_token'].forEach((name) =>
    res.cookies.set(name, '', { path: '/', maxAge: 0 })
  );
  recordAudit({
    userId: 'u-admin',
    userName: 'Sistema',
    entity: 'auth',
    entityId: 'logout',
    action: 'logout',
    before: null,
    after: { success: true },
    ip: undefined,
    userAgent: undefined,
  });
  return res;
}
