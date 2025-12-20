import { NextResponse, type NextRequest } from 'next/server';
import { getModuleActivitySummary } from '@/lib/history.server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const daysParam = Number(url.searchParams.get('days') ?? '');
    const sinceDays = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 30;
    const summary = await getModuleActivitySummary({ sinceDays });
    return NextResponse.json(summary);
  } catch (error) {
    console.error('GET /api/history/summary', error);
    return NextResponse.json(
      { error: 'Falha ao carregar o fluxo de atividades.' },
      { status: 500 }
    );
  }
}
