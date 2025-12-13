export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listStores, createStore, updateStore, deleteStore } from '@/lib/stores.server';

export async function GET() {
  try {
    const stores = await listStores();
    return NextResponse.json(stores);
  } catch (err) {
    try { console.error('GET /api/stores error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to load stores';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const created = await createStore({ name: body.name, location: body.location, lat: body.lat, lng: body.lng });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    try { console.error('POST /api/stores error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to create store';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const updated = await updateStore(body.id, body);
    if (!updated) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    try { console.error('PUT /api/stores error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to update store';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const ok = await deleteStore(id);
    if (!ok) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    try { console.error('DELETE /api/stores error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to delete store';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
