import { NextResponse } from 'next/server';
import { listStores, createStore, updateStore, deleteStore } from '@/lib/stores.server';

export async function GET() {
  try {
    const stores = await listStores();
    return NextResponse.json(stores);
  } catch (err) {
    console.error('GET /api/stores error', err);
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const created = await createStore({ name: body.name, location: body.location, lat: body.lat, lng: body.lng });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/stores error', err);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
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
    console.error('PUT /api/stores error', err);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
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
    console.error('DELETE /api/stores error', err);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
