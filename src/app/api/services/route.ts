import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM services ORDER BY last_update DESC');

  // Attach store associations
  const ids = rows.map((r: any) => r.id).filter(Boolean);
  if (ids.length > 0) {
    try {
      const { rows: maps } = await pool.query('SELECT service_id, store_id FROM service_stores WHERE service_id = ANY($1)', [ids]);
      const mapByService: Record<string, string[]> = {};
      for (const m of maps) {
        mapByService[m.service_id] = mapByService[m.service_id] || [];
        mapByService[m.service_id].push(String(m.store_id));
      }
      for (const r of rows) {
        r.stores = mapByService[r.id] || [];
      }
    } catch (err: any) {
      console.debug('/api/services: failed to load service_stores mapping, continuing without store associations', err?.message || err);
      for (const r of rows) {
        r.stores = [];
      }
    }
  }

  return NextResponse.json({ ok: true, result: rows });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || `srv-${Date.now()}`;
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

    if (!title || !location || !status || !statusReason || !owner) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const lastUpdate = new Date().toISOString();

    await pool.query(
      `INSERT INTO services (id, title, location, status, status_reason, owner, dependency, next_action, next_followup_date, status_since, last_update, unlock_what, area_type, area_value, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
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

    // insert store mappings if provided
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

    const { rows: out } = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    const result = out[0];
    result.stores = Array.isArray(stores) ? stores : [];
    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/services error', err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }

}
