export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getDataQualitySnapshot } from '@/lib/observability.server';

export async function GET() {
  try {
    const snapshot = await getDataQualitySnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error('GET /api/data-quality error', err);
    return NextResponse.json({ error: 'Failed to load data quality snapshot' }, { status: 500 });
  }
}
