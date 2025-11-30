import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '@/server/adapters/users-adapter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const user = await getUserById(id);
  if (!user) return NextResponse.json({ message: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, result: user });
}

export async function PUT(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  const body = await request.json();
  const updated = await updateUser(id, body);
  return NextResponse.json({ ok: true, result: updated });
}

export async function DELETE(request: NextRequest, context: { params: any }) {
  const { id } = await context.params as { id: string };
  const token = request.cookies.get('pm_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  const verified = verifyAccessToken(token);
  if (!verified.valid) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
