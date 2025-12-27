export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { deleteAiInsight, updateAiInsight } from '@/lib/ai-insights.server';

type RouteContext = any;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const updated = await updateAiInsight(context.params.id, body ?? {});
    if (!updated) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/ai-insights/:id error', err);
    return NextResponse.json({ error: 'Failed to update AI insight' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const ok = await deleteAiInsight(context.params.id);
    if (!ok) return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/ai-insights/:id error', err);
    return NextResponse.json({ error: 'Failed to delete AI insight' }, { status: 500 });
  }
}
