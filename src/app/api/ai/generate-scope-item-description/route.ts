export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { runScopeItemDescription } from '@/ai/flows/generate-scope-item-description.server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Informe o título do item.' }, { status: 400 });
    }
    const result = await runScopeItemDescription({
      title: body.title,
      context: typeof body.context === 'string' ? body.context : undefined,
      tone: typeof body.tone === 'string' ? body.tone : undefined,
      preferenceText: typeof body.preferenceText === 'string' ? body.preferenceText : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Unable to generate item description', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar descrições no momento.' },
      { status: 500 }
    );
  }
}
