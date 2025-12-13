export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { getUserHistory, logUserHistory } from '@/lib/history.server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }
    const limitRaw = Number(url.searchParams.get('limit') ?? '');
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 25;
    const history = await getUserHistory(userId, { limit });
    return NextResponse.json({ history });
  } catch (error) {
    console.error('GET /api/history', error);
    return NextResponse.json({ error: 'Falha ao carregar histórico' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const pathname = body?.pathname;
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }
    if (!pathname) {
      return NextResponse.json({ error: 'pathname é obrigatório' }, { status: 400 });
    }
    const entry = await logUserHistory(userId, {
      module: body.module,
      action: body.action,
      pathname,
      details: body.details,
    });
    return NextResponse.json(entry);
  } catch (error) {
    console.error('POST /api/history', error);
    return NextResponse.json({ error: 'Falha ao registrar atividade' }, { status: 500 });
  }
}
