import { NextRequest, NextResponse } from 'next/server';
import { listRoles, getRoleById, getRolePermissions } from '@/server/adapters/roles-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const rows = await listRoles();
  return NextResponse.json({ ok: true, result: rows });
}
