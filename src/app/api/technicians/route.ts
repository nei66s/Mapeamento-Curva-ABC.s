import { NextResponse } from 'next/server';
import { createTechnician, deleteTechnician, listTechnicians } from '@/lib/technicians.server';

export async function GET() {
  const list = await listTechnicians();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const tech = await createTechnician({ name: String(body.name), role: body.role ? String(body.role) : undefined });
    return NextResponse.json(tech, { status: 201 });
  } catch (err) {
    console.error('POST /api/technicians error', err);
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const ok = await deleteTechnician(id);
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/technicians error', err);
    return NextResponse.json({ error: 'delete failed' }, { status: 500 });
  }
}
