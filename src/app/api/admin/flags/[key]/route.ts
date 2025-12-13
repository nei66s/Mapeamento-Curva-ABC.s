export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getFlagByKey, setFlag } from '@/server/adapters/feature-flags-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest, context: { params: any }) {
  const { key } = await context.params as { key: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const flag = await getFlagByKey(key);
  if (!flag) return NextResponse.json({ message: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, result: flag });
}

export async function PUT(request: NextRequest, context: { params: any }) {
  const { key } = await context.params as { key: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const body = await request.json();
  const updated = await setFlag(key, !!body.enabled);
  return NextResponse.json({ ok: true, result: updated });
}
