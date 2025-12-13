export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createVacationRequest, deleteVacationRequest, listVacationRequests } from '@/lib/vacation-requests.server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const data = await listVacationRequests();
    return NextResponse.json(data);
  } catch (err) {
    try { console.error('GET /api/vacations error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to load vacations';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.debug('POST /api/vacations body:', JSON.stringify(body));
    if (!body?.userId || !body?.startDate || !body?.endDate) {
      return NextResponse.json({ error: 'userId, startDate and endDate are required' }, { status: 400 });
    }
    const created = await createVacationRequest(body);
    console.debug('POST /api/vacations created:', created);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/vacations error', err);
    // Include basic error detail in response for local debugging (avoid leaking in prod)
    let message = 'Failed to create vacation request';
    if (err instanceof Error) message = err.message;
    else {
      try { message = String(err); } catch (_) { /* ignore */ }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Diagnostic: confirm which database URL is used by this worker.
    try {
      const poolOpts = (pool as any).options || {};
      console.debug('DELETE /api/vacations DB env:', {
        DATABASE_URL: process.env.DATABASE_URL,
        poolConnectionString: poolOpts.connectionString,
      });
    } catch (e) {
      console.debug('DELETE /api/vacations DB diagnostic failed', e);
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const sanitized = String(id).trim().replace(/^\"+|\"+$/g, '');
    console.debug('DELETE /api/vacations id received:', { raw: id, sanitized });
    const ok = await deleteVacationRequest(sanitized);
    if (!ok) {
      console.warn('DELETE /api/vacations not found:', sanitized);
      return NextResponse.json({ error: 'Vacation not found', id: sanitized }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    try { console.error('DELETE /api/vacations error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to delete vacation';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
