export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getUserById } from '@/server/adapters/users-adapter';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('pm_access_token')?.value;
  const verified = verifyAccessToken(accessToken || '');
  if (!verified.valid) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const user = await getUserById(String(verified.userId));
  if (!user) return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 401 });

  return NextResponse.json(user);
}
