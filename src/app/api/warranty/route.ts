import { NextResponse } from 'next/server';

// TODO: Replace with DB-backed implementation when warranty items are migrated
export async function GET() {
  try {
    return NextResponse.json([]);
  } catch (err) {
    console.error('GET /api/warranty error', err);
    return NextResponse.json({ error: 'Failed to load warranty items' }, { status: 500 });
  }
}
