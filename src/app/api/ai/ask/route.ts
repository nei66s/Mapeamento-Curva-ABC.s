export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = String(body?.prompt ?? '');
    // Resposta de exemplo — integrar com serviço de LLM/GenKit quando pronto
    const answer = `Recebi: "${prompt}". Sugestões: 1) Verifique itens A e B; 2) Rode rebuild dos indicadores; 3) Analise lojas com baixo fill-rate.`;
    return NextResponse.json({ ok: true, answer });
  } catch (error) {
    console.error('POST /api/ai/ask', error);
    return NextResponse.json({ ok: false, error: 'Falha ao processar prompt' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, status: 'ready' });
}
