import { NextResponse } from 'next/server';
import { getAllRows, createRow, upsertRow } from '@/lib/maintenance-store.server';
import type { MaintenanceRow } from '@/lib/maintenance-types';

export async function GET() {
  try {
    const rows = await getAllRows();
    return NextResponse.json({ ok: true, result: rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await createRow(body);
    return NextResponse.json({ ok: true, result: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const row = body as MaintenanceRow;
    if (!row?.id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
    const updated = await upsertRow(row);
    return NextResponse.json({ ok: true, result: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
