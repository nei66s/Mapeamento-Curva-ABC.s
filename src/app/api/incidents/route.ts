import { NextResponse } from 'next/server';
import { getIncidents } from '@/lib/incidents.server';

export async function GET() {
  try {
    const incidents = await getIncidents();
    return NextResponse.json(incidents);
  } catch (err) {
    const e: any = err;
    console.error('GET /api/incidents error', e?.message ?? e, e?.stack ?? 'no-stack');
    // In development, return an empty array so the UI keeps working when the DB or table is missing
    // (this avoids a hard 500 during local development). In production keep returning 500.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('GET /api/incidents: returning development fallback (empty) due to DB error');
      return NextResponse.json([]);
    }

    return NextResponse.json({ error: 'Failed to load incidents' }, { status: 500 });
  }
}
