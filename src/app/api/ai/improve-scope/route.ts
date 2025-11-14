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
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Unable to improve scope text', error);
    return NextResponse.json(
      { error: 'Não foi possível melhorar o texto agora.' },
      { status: 500 }
    );
  }
}
