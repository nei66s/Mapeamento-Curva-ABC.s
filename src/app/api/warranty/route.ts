import { NextResponse } from 'next/server';
import { listWarranties, createWarranty, updateWarranty, deleteWarranty } from '@/lib/warranty.server';

export async function GET(req: Request) {
  try {
    const items = await listWarranties();
    return NextResponse.json(items);
  } catch (err) {
    console.error('GET /api/warranty error', err);
    return NextResponse.json({ error: 'Failed to load warranty items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await createWarranty(body);
    if (!created) return NextResponse.json({ error: 'Failed to create warranty item' }, { status: 500 });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/warranty error', err);
    return NextResponse.json({ error: 'Failed to create warranty item' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const body = await req.json();
    const updated = await updateWarranty(id, body);
    if (!updated) return NextResponse.json({ error: 'Not found or failed to update' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/warranty error', err);
    return NextResponse.json({ error: 'Failed to update warranty item' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await deleteWarranty(id);
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/warranty error', err);
    return NextResponse.json({ error: 'Failed to delete warranty item' }, { status: 500 });
  }
}
