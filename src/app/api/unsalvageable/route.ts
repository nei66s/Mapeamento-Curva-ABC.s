import { NextResponse } from 'next/server';
import { createUnsalvageable, listUnsalvageable } from '@/lib/unsalvageable.server';

export async function GET() {
  try {
    const items = await listUnsalvageable();
    return NextResponse.json(items);
  } catch (err) {
    console.error('GET /api/unsalvageable error', err);
    return NextResponse.json({ error: 'Failed to load unsalvageable items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.itemName) {
      return NextResponse.json({ error: 'itemName is required' }, { status: 400 });
    }
    const created = await createUnsalvageable(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/unsalvageable error', err);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
