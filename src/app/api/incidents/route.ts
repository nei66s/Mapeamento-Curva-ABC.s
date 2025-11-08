import { NextResponse } from 'next/server';
import { createIncident, deleteIncident, getIncidents, updateIncident } from '@/lib/incidents.server';

export async function GET() {
  try {
    const incidents = await getIncidents();
    return NextResponse.json(incidents);
  } catch (err) {
    const e: any = err;
    console.error('GET /api/incidents error', e?.message ?? e, e?.stack ?? 'no-stack');
    if (process.env.NODE_ENV !== 'production') {
      console.warn('GET /api/incidents: returning development fallback (empty) due to DB error');
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: 'Failed to load incidents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.itemName || !body?.location || !body?.description) {
      return NextResponse.json({ error: 'itemName, location and description are required' }, { status: 400 });
    }
    const created = await createIncident(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/incidents error', err);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const updated = await updateIncident(body.id, body);
    if (!updated) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/incidents error', err);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const ok = await deleteIncident(id);
    if (!ok) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/incidents error', err);
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}
