import { NextResponse } from 'next/server';
import { listItems } from '@/lib/items.server';
// Dev-only mocks when DB schema is incomplete
import { itemNames, itemCategoryMap } from '@/lib/mock-raw';
import { createItem, createItemsBulk } from '@/lib/items.server';

export async function GET() {
  try {
    const items = await listItems();
    return NextResponse.json(items);
  } catch (err) {
    // Ensure we can access message/stack safely
    const e: any = err;
    // Log useful error details server-side for debugging
    console.error('GET /api/items error', e?.message ?? e, e?.stack ?? 'no-stack');
    // In non-production, if this is a missing relation (incomplete migrations),
    // return a small synthetic dataset so the UI can keep working while you run migrations.
    if (process.env.NODE_ENV !== 'production' && String(e?.message ?? '').includes('relation')) {
      const mock = itemNames.slice(0, 20).map((name, idx) => ({
        id: String(idx + 1),
        name,
        category: itemCategoryMap[name] || 'Sem Categoria',
        classification: (['A', 'B', 'C'] as const)[idx % 3],
        storeCount: Math.floor(Math.random() * 10),
        impactFactors: [],
        status: 'offline',
        contingencyPlan: '',
        leadTime: '',
        imageUrl: null,
      }));
      console.warn('GET /api/items: returning development mock items due to DB relation error');
      return NextResponse.json(mock);
    }

    // In production (or other errors) expose a small, sanitized error detail to help debugging from the client
    const body: any = { error: 'Failed to load items' };
    // Always provide a clear, actionable hint when the error looks like an ioredis/Redis connection
    // issue. Keep the original message and stack in server logs only.
    const msg = String(e?.message ?? e);
    if (msg.includes('maxRetriesPerRequest') || msg.toLowerCase().includes('redis')) {
      body.detail = 'Redis connection failed (max retries reached). Check REDIS_URL or Redis server availability.';
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, expose the raw message to help debugging for other errors
      body.detail = msg;
    }
    return NextResponse.json(body, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      const created = await createItemsBulk(body);
      return NextResponse.json(created, { status: 201 });
    }
    const created = await createItem(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const e: any = err;
    console.error('POST /api/items error', e?.message ?? e, e?.stack ?? 'no-stack');
    return NextResponse.json({ error: 'Failed to create item', details: String(e?.message ?? e) }, { status: 500 });
  }
}
