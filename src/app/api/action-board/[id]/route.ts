export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { deleteActionBoardItem, updateActionBoardItem } from '@/lib/action-board.server';

type RouteContext = any;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const updated = await updateActionBoardItem(context.params.id, body ?? {});
    if (!updated) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/action-board/:id error', err);
    return NextResponse.json({ error: 'Failed to update action board item' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const ok = await deleteActionBoardItem(context.params.id);
    if (!ok) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/action-board/:id error', err);
    return NextResponse.json({ error: 'Failed to delete action board item' }, { status: 500 });
  }
}
