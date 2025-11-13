import { NextResponse } from 'next/server';
import { createTool, createToolsBulk, deleteTool, listTools, updateTool } from '@/lib/tools.server';

export async function GET() {
  try {
    const tools = await listTools();
    return NextResponse.json(tools);
  } catch (err) {
    try { console.error('GET /api/tools error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to load tools';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      const created = await createToolsBulk(body);
      return NextResponse.json(created, { status: 201 });
    }
    const created = await createTool(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    try { console.error('POST /api/tools error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to create tool';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const updated = await updateTool(body.id, body);
    if (!updated) return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    try { console.error('PUT /api/tools error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to update tool';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return PUT(req);
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const ok = await deleteTool(id);
    if (!ok) return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    try { console.error('DELETE /api/tools error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to delete tool';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
