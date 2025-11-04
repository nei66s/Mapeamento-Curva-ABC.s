import { NextResponse } from 'next/server';
import { listStores } from '@/lib/stores.server';

export async function GET() {
  try {
    const stores = await listStores();
    return NextResponse.json(stores);
  } catch (err) {
    console.error('GET /api/stores error', err);
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 500 });
  }
}
