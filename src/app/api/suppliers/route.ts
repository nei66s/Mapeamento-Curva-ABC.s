import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import {
  listSuppliers,
  createSupplier,
  createSuppliersBulk,
  updateSupplier,
  deleteSupplier,
} from '@/lib/suppliers.server';

// Short TTL for cached supplier lists
const SUPPLIERS_CACHE_TTL = 5000; // ms

// In-memory fallback cache (per-process)
const suppliersCache = new Map<string, { ts: number; data: any }>();

// Optional Redis client (only created if REDIS_URL is provided)
// Do NOT create a global Redis client at module import time. Instead,
// create/connect lazily per-request so connection problems don't cause
// long-running retries during unrelated requests (see ioredis `maxRetriesPerRequest`).
// If REDIS_URL is not set, we simply skip Redis.
const REDIS_URL = process.env.REDIS_URL || null;

async function createRedisClient() {
  if (!REDIS_URL) return null;
  let client: Redis | null = null;
  try {
    // Use conservative retry behavior and lazyConnect so we control connect timing.
    client = new Redis(REDIS_URL, {
      // avoid very long automatic retries; tune as needed
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // do not queue commands while offline to fail fast
      enableOfflineQueue: false,
    });
    // attach a minimal error logger
    client.on('error', (e) => console.error('redis error', e));
    // attempt an explicit connect; if it fails we'll catch below and return null
    await client.connect();
    return client;
  } catch (e) {
    console.error('Failed to initialize Redis client (skipping Redis):', e);
    try {
      if (client) await client.disconnect();
    } catch (_) {
      // ignore
    }
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? Number.parseInt(offsetParam, 10) : undefined;

    const key = `${Number.isFinite(limit) ? limit : 'all'}:${Number.isFinite(offset) ? offset : 0}`;
    const now = Date.now();
    // Try Redis first (if configured). Create a client lazily and connect explicitly.
    let client: Redis | null = null;
    if (REDIS_URL) {
      try {
        client = await createRedisClient();
        if (client) {
          try {
            const rkey = `suppliers:${key}`;
            const cachedJson = await client.get(rkey);
            if (cachedJson) {
              await client.disconnect();
              return NextResponse.json(JSON.parse(cachedJson));
            }
            const suppliers = await listSuppliers({ limit: Number.isFinite(limit) ? limit : undefined, offset: Number.isFinite(offset) ? offset : undefined });
            // set with TTL in seconds (ceil)
            await client.setex(rkey, Math.ceil(SUPPLIERS_CACHE_TTL / 1000), JSON.stringify(suppliers));
            await client.disconnect();
            return NextResponse.json(suppliers);
          } catch (e) {
            console.error('Redis cache error, falling back to in-memory', e);
            try { await client.disconnect(); } catch (_) { /* ignore */ }
          }
        }
      } catch (e) {
        console.error('Redis init error, falling back to in-memory', e);
        try { if (client) await client.disconnect(); } catch (_) { /* ignore */ }
      }
    }

    // Fallback: in-memory cache per-process
    const cached = suppliersCache.get(key);
    if (cached && (now - cached.ts) < SUPPLIERS_CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const suppliers = await listSuppliers({ limit: Number.isFinite(limit) ? limit : undefined, offset: Number.isFinite(offset) ? offset : undefined });
    suppliersCache.set(key, { ts: now, data: suppliers });
    return NextResponse.json(suppliers);
  } catch (err) {
    console.error('GET /api/suppliers error', err);
    return NextResponse.json({ error: 'Failed to load suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body)) {
      const created = await createSuppliersBulk(body);
      return NextResponse.json(created, { status: 201 });
    }
    const created = await createSupplier(body);
    if (!created) return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/suppliers error', err);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const updated = await updateSupplier(String(id), data);
    if (!updated) return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/suppliers error', err);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await deleteSupplier(String(id));
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/suppliers error', err);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
