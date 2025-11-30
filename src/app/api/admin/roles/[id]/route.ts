import { NextRequest, NextResponse } from 'next/server';
import { getRoleById, getRolePermissions } from '@/server/adapters/roles-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const role = await getRoleById(id);
  if (!role) return NextResponse.json({ message: 'not found' }, { status: 404 });
  const perms = await getRolePermissions(id);
  return NextResponse.json({ ok: true, result: { ...role, permissions: perms } });
}
