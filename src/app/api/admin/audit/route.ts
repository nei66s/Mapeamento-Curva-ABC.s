import { NextRequest, NextResponse } from 'next/server';
import { listAudit } from '@/server/adapters/audit-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const page = Number(request.nextUrl.searchParams.get('page') || '1');
  const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '100');
  const offset = (page - 1) * pageSize;
  const rows = await listAudit(pageSize, offset);
  return NextResponse.json({ ok: true, result: rows });
}
