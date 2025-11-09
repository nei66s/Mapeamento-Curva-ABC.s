import { NextResponse } from 'next/server';
import { createVacationRequest, deleteVacationRequest, listVacationRequests } from '@/lib/vacation-requests.server';

export async function GET() {
  try {
    const data = await listVacationRequests();
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/vacations error', err);
    return NextResponse.json({ error: 'Failed to load vacations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.userId || !body?.startDate || !body?.endDate) {
      return NextResponse.json({ error: 'userId, startDate and endDate are required' }, { status: 400 });
    }
    const created = await createVacationRequest(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/vacations error', err);
    return NextResponse.json({ error: 'Failed to create vacation request' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const ok = await deleteVacationRequest(id);
    if (!ok) return NextResponse.json({ error: 'Vacation not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/vacations error', err);
    return NextResponse.json({ error: 'Failed to delete vacation' }, { status: 500 });
  }
}
