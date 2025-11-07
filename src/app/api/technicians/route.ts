import { NextResponse } from 'next/server';
import { getTechnicians, addTechnician, deleteTechnician } from '@/lib/technicians-store';

export async function GET() {
  const list = getTechnicians();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const id = `tech-${Date.now()}`;
    const tech = { id, name: String(body.name), role: body.role ? String(body.role) : '' };
    addTechnician(tech);
    return NextResponse.json(tech, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const ok = deleteTechnician(id);
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 });
  }
}
