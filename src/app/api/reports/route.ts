export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import {
  createTechnicalReport,
  deleteTechnicalReport,
  listTechnicalReports,
  updateTechnicalReport,
} from '@/lib/technical-reports.server';

export async function GET() {
  try {
    const reports = await listTechnicalReports();
    return NextResponse.json(reports);
  } catch (err) {
    console.error('GET /api/reports error', err);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.title || !body?.technicianId) {
      return NextResponse.json({ error: 'title and technicianId are required' }, { status: 400 });
    }
    const report = await createTechnicalReport(body);
    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    console.error('POST /api/reports error', err);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const updated = await updateTechnicalReport(body.id, body);
    if (!updated) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/reports error', err);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const ok = await deleteTechnicalReport(id);
    if (!ok) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/reports error', err);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
