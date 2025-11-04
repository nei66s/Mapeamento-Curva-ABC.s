import { NextResponse } from 'next/server';

// TODO: Replace with DB-backed implementation when tools are migrated
export async function GET() {
  try {
    return NextResponse.json([]);
  } catch (err) {
    console.error('GET /api/tools error', err);
    return NextResponse.json({ error: 'Failed to load tools' }, { status: 500 });
  }
}
