import { NextResponse } from 'next/server';
import { syncLancamentos } from '@/lib/lancamentos.server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const since = body && body.since ? String(body.since) : undefined;
    const result = await syncLancamentos({ since });
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('sync-lancamentos error', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
