export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getModuleByKey, updateModuleByKey } from '@/server/adapters/modules-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest, context: { params: any }) {
  const { key } = await context.params as { key: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const m = await getModuleByKey(key);
  if (!m) return NextResponse.json({ message: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, result: m });
}

export async function PUT(request: NextRequest, context: { params: any }) {
  const { key } = await context.params as { key: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const body = await request.json();
  const updated = await updateModuleByKey(key, body);
  return NextResponse.json({ ok: true, result: updated });
}
