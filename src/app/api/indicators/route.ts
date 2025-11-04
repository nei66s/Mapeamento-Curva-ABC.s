import { NextResponse } from 'next/server';

// TODO: Replace with DB-backed implementation when indicators are migrated
export async function GET() {
  try {
    return NextResponse.json([]);
  } catch (err) {
    console.error('GET /api/indicators error', err);
    return NextResponse.json({ error: 'Failed to load indicators' }, { status: 500 });
  }
}
