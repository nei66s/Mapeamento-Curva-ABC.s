export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Minimal tracking: log server-side for now. Integrate with real analytics later.
    console.info('AI chat tracking event', body);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('AI track error', e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
