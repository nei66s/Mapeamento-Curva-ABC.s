export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(request: Request, context: any) {
  const { params } = context || {};
  const { id } = params || {};
  try {
    const body = await request.json();
    // allow updating status, received_date, file_url
    const { status, fileUrl } = body as any;
    const updates: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (typeof status !== 'undefined') {
      updates.push(`status = $${idx++}`);
      vals.push(status);
    }
    if (typeof fileUrl !== 'undefined') {
      updates.push(`file_url = $${idx++}`);
      vals.push(fileUrl);
    }
    if (updates.length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
    // if status is Recebida and received_date not provided, set received_date = now()
    if (status === 'Recebida') {
      updates.push(`received_date = now()`);
    }
    vals.push(id);
    const sql = `UPDATE settlement_letters SET ${updates.join(', ')} WHERE id = $${vals.length} RETURNING *`;
    const res = await db.query(sql, vals);
    if (res.rowCount === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const row = res.rows[0];
    return NextResponse.json(row);
  } catch (err) {
    console.error('PATCH /api/settlements/:id error', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

export async function POST(request: Request, context: any) {
  // used as upload endpoint: POST /api/settlements/:id/upload would map to this if placed accordingly.
  try {
    const { params } = context || {};
    const { id } = params || {};
    const body = await request.json();
    const { fileUrl } = body as any;
    if (!fileUrl) return NextResponse.json({ error: 'fileUrl required' }, { status: 400 });
    const res = await db.query('UPDATE settlement_letters SET file_url = $1, status = $2, received_date = now() WHERE id = $3 RETURNING *', [fileUrl, 'Recebida', id]);
    if (res.rowCount === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('POST /api/settlements/:id upload error', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
