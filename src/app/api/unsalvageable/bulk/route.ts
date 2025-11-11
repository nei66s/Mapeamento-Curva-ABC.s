import { NextResponse } from 'next/server';
import { createUnsalvageableBulk } from '@/lib/unsalvageable.server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'Array required' }, { status: 400 });
    }
    const created = await createUnsalvageableBulk(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/unsalvageable/bulk error', err);
    return NextResponse.json({ error: 'Failed to create bulk records' }, { status: 500 });
  }
}
