import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, context: any) {
  const params = context?.params;
  const { id } = params || {};
  const { rows } = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
  if (!rows || rows.length === 0) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  const service = rows[0];
  const { rows: maps } = await pool.query('SELECT store_id FROM service_stores WHERE service_id = $1', [id]);
  service.stores = maps.map((m: any) => String(m.store_id));
  return NextResponse.json({ ok: true, result: service });
}

export async function PUT(req: Request, context: any) {
  try {
    const params = context?.params;
    const { id } = params || {};
    const body = await req.json();
    const {
      title,
      location,
      status,
      statusReason,
      owner,
      dependency,
      nextAction,
      nextFollowupDate,
      statusSince,
      unlockWhat,
      areaType,
      areaValue,
      category,
      stores,
    } = body;

    const lastUpdate = new Date().toISOString();

    await pool.query(
      `UPDATE services SET title=$2, location=$3, status=$4, status_reason=$5, owner=$6, dependency=$7, next_action=$8, next_followup_date=$9, status_since=$10, last_update=$11, unlock_what=$12, area_type=$13, area_value=$14, category=$15 WHERE id=$1`,
      [
        id,
        title,
        location,
        status,
        statusReason,
        owner,
        dependency || null,
        nextAction || null,
        nextFollowupDate || null,
        statusSince || null,
        lastUpdate,
        unlockWhat || null,
        areaType || null,
        areaValue || null,
        category || null,
      ]
    );

    // update store mappings
    await pool.query('DELETE FROM service_stores WHERE service_id = $1', [id]);
    if (Array.isArray(stores) && stores.length > 0) {
      const vals: string[] = [];
      const params: any[] = [];
      let idx = 1;
      for (const s of stores) {
        vals.push(`($${idx++}, $${idx++})`);
        params.push(id, s);
      }
      const q = `INSERT INTO service_stores (service_id, store_id) VALUES ${vals.join(',')}`;
      await pool.query(q, params);
    }

    const { rows } = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    const service = rows[0];
    const { rows: maps } = await pool.query('SELECT store_id FROM service_stores WHERE service_id = $1', [id]);
    service.stores = maps.map((m: any) => String(m.store_id));
    return NextResponse.json({ ok: true, result: service });
  } catch (err: any) {
    console.error('PUT /api/services/[id] error', err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const params = context?.params;
    const { id } = params || {};
    await pool.query('DELETE FROM service_stores WHERE service_id = $1', [id]);
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/services/[id] error', err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
