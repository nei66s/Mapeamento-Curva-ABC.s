import { NextRequest, NextResponse } from 'next/server';
import { adminUsers, verifyAccessToken } from '../../_data';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('pm_access_token')?.value;
  const verified = verifyAccessToken(accessToken);
  if (!verified.valid) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const user = adminUsers.find((u) => u.id === verified.userId);
  if (!user) return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 401 });

  return NextResponse.json(user);
}
