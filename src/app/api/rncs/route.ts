export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listRncs, createRnc, createRncsBulk, updateRnc, deleteRnc } from '@/lib/rncs.server';

export async function GET() {
  try {
    const rncs = await listRncs();
    return NextResponse.json(rncs);
  } catch (err) {
    console.error('GET /api/rncs error', err);
    return NextResponse.json({ error: 'Failed to load RNCS' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body)) {
      const created = await createRncsBulk(body);
      return NextResponse.json(created, { status: 201 });
    }
    const created = await createRnc(body);
    if (!created) return NextResponse.json({ error: 'Failed to create RNC' }, { status: 500 });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/rncs error', err);
    return NextResponse.json({ error: 'Failed to create RNC' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const updated = await updateRnc(String(id), data);
    if (!updated) return NextResponse.json({ error: 'Failed to update RNC' }, { status: 500 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/rncs error', err);
    return NextResponse.json({ error: 'Failed to update RNC' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await deleteRnc(String(id));
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/rncs error', err);
    return NextResponse.json({ error: 'Failed to delete RNC' }, { status: 500 });
  }
}
