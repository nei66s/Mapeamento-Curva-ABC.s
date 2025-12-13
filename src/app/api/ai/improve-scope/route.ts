export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { runScopeTextImprovement } from '@/ai/flows/improve-scope-flow.server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json(
        { error: 'Informe o texto que deseja melhorar.' },
        { status: 400 }
      );
    }
    const result = await runScopeTextImprovement({
      text: body.text,
      context: typeof body.context === 'string' ? body.context : undefined,
      tone: typeof body.tone === 'string' ? body.tone : undefined,
      preferenceText: typeof body.preferenceText === 'string' ? body.preferenceText : undefined,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Unable to improve scope text', error);
    const msg = String(error?.message || error);
    // Map known transient/provider errors to 503, rate limits to 429
    if (/503|Service Unavailable|overloaded|temporarily unavailable/i.test(msg)) {
      return NextResponse.json(
        { error: 'Serviço de IA temporariamente indisponível. Tente novamente mais tarde.', detail: msg, traceId: error?.traceId },
        { status: 503 }
      );
    }
    if (/429|rate limit/i.test(msg)) {
      return NextResponse.json(
        { error: 'Limite de requisições atingido ao chamar o serviço de IA. Tente novamente mais tarde.', detail: msg },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Não foi possível melhorar o texto agora.', detail: msg },
      { status: 500 }
    );
  }
}
