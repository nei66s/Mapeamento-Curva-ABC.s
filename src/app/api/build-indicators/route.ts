import { NextResponse } from 'next/server';
import { buildIndicators } from '@/lib/lancamentos.server';

export async function POST(request: Request) {
  try {
    const result = await buildIndicators();
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('build-indicators error', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
