import { NextResponse } from 'next/server';

// TODO: Replace with DB-backed implementation when settlements are migrated
export async function GET() {
  try {
    return NextResponse.json([]);
  } catch (err) {
    console.error('GET /api/settlements error', err);
    return NextResponse.json({ error: 'Failed to load settlements' }, { status: 500 });
  }
}
