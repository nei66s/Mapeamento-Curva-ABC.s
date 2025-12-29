export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAiInsight, listAiInsights } from '@/lib/ai-insights.server';

export async function GET() {
  try {
    const insights = await listAiInsights();
    return NextResponse.json(insights);
  } catch (err) {
    console.error('GET /api/ai-insights error', err);
    return NextResponse.json({ error: 'Failed to load AI insights' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    const created = await createAiInsight(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/ai-insights error', err);
    return NextResponse.json({ error: 'Failed to create AI insight' }, { status: 500 });
  }
}
