import { NextResponse } from 'next/server';
import {
  listChecklistItems,
  listScheduledVisits,
  scheduleVisit,
  updateVisitItemStatus,
  deleteScheduledVisit,
} from '@/lib/compliance.server';

export async function GET(req: Request) {
  try {
    const [checklist, visits] = await Promise.all([listChecklistItems(), listScheduledVisits()]);
    return NextResponse.json({ checklistItems: checklist, storeData: visits });
  } catch (err) {
    console.error('GET /api/compliance error', err);
    return NextResponse.json({ error: 'Failed to load compliance data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await scheduleVisit(body);
    if (!created) return NextResponse.json({ error: 'Failed to schedule visit' }, { status: 500 });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/compliance error', err);
    return NextResponse.json({ error: 'Failed to schedule visit' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // Accept either { visitId, itemId, status } OR { storeId, visitDate, itemId, status }
    const { visitId, storeId, visitDate, itemId, status } = body;
    if (!itemId || !status) {
      console.error('PUT /api/compliance missing itemId or status', { body });
      return NextResponse.json({ error: 'Missing itemId or status' }, { status: 400 });
    }

    let ok = false;
    if (visitId) {
      // lazy-load the function to avoid circular issues
      const mod = await import('@/lib/compliance.server');
      ok = await mod.updateVisitItemStatusByVisitId(visitId, itemId, status);
    } else {
      if (!storeId || !visitDate) {
        console.error('PUT /api/compliance missing storeId or visitDate', { body });
        return NextResponse.json({ error: 'Missing storeId or visitDate' }, { status: 400 });
      }
      ok = await updateVisitItemStatus(storeId, visitDate, itemId, status);
    }
    if (!ok) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/compliance error', err);
    // return a small hint in the response to help dev debugging (non-sensitive)
    return NextResponse.json({ error: 'Failed to update visit item', details: String((err as any)?.message || err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get('storeId');
    const visitDate = url.searchParams.get('visitDate');
    if (!storeId || !visitDate) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    const ok = await deleteScheduledVisit(storeId, visitDate);
    if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/compliance error', err);
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
  }
}
