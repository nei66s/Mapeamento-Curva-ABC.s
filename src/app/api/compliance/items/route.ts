import { NextResponse } from 'next/server';
import { listChecklistItems, addChecklistItem, deleteChecklistItem } from '@/lib/compliance.server';

export async function GET() {
  try {
    const items = await listChecklistItems();
    return NextResponse.json(items);
  } catch (err) {
    console.error('GET /api/compliance/items error', err);
    return NextResponse.json({ error: 'Failed to load checklist items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body?.name;
    const classification = body?.classification ?? 'C';
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    const created = await addChecklistItem({ name, classification });
    if (!created) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/compliance/items error', err);
    return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = body?.itemId || body?.id || null;
    if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
    const ok = await deleteChecklistItem(String(itemId));
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/compliance/items error', err);
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
}
