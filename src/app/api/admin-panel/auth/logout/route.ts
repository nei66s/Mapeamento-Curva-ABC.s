export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { logAudit } from '@/server/adapters/audit-adapter';

export async function POST() {
  const res = NextResponse.json({ success: true });
  ['pm_access_token', 'pm_refresh_token'].forEach((name) => res.cookies.set(name, '', { path: '/', maxAge: 0 }));
  try { await logAudit({ user_id: 'u-admin', entity: 'auth', entity_id: 'logout', action: 'logout', before_data: null, after_data: { success: true }, ip: undefined, user_agent: undefined }); } catch (e) {}
  return res;
}
