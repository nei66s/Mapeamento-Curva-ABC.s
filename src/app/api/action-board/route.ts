export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createActionBoardItem, listActionBoardItems } from '@/lib/action-board.server';

export async function GET() {
  try {
    const items = await listActionBoardItems();
    return NextResponse.json(items);
  } catch (err) {
    console.error('GET /api/action-board error', err);
    return NextResponse.json({ error: 'Failed to load action board' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.owner) {
      return NextResponse.json({ error: 'title and owner are required' }, { status: 400 });
    }
    const created = await createActionBoardItem(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/action-board error', err);
    return NextResponse.json({ error: 'Failed to create action board item' }, { status: 500 });
  }
}
