export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const c = await cookies();
    const pm = c.get('pm_user')?.value ? true : false;
    const session = c.get('session')?.value ? true : false;
    const nextAuth = c.get('next-auth.session-token')?.value ? true : false;
    let pmRole: string | null = null;
    if (pm) {
      try {
        const parsed = JSON.parse(decodeURIComponent(String(c.get('pm_user')?.value)));
        pmRole = parsed?.role ?? null;
      } catch (e) {
        pmRole = 'malformed';
      }
    }
    return NextResponse.json({ ok: true, cookies: { pm, session, nextAuth, pmRole } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'failed to read cookies' }, { status: 500 });
  }
}
