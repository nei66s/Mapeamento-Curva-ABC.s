export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listFlags } from '@/server/adapters/feature-flags-adapter';

export async function GET() {
  const rows = await listFlags();
  return NextResponse.json(rows);
}
