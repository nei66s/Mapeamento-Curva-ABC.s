import { NextRequest, NextResponse } from 'next/server';
import { listUsers, createUser } from '@/server/adapters/users-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const q = request.nextUrl.searchParams;
  const page = Number(q.get('page') || '1');
  const pageSize = Number(q.get('pageSize') || '50');
  const offset = (page - 1) * pageSize;
  const rows = await listUsers(pageSize, offset);
  return NextResponse.json({ ok: true, result: rows });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const body = await request.json();
  const created = await createUser({ name: body.name, email: body.email, password_hash: body.password_hash || null, role: body.role });
  return NextResponse.json({ ok: true, result: created });
}
