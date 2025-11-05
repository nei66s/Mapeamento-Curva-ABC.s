import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Support two possible schemas: legacy `settlements` table (detailed columns)
// and `settlement_letters` (simple: id, title, content, date).
// The API will try to use `settlement_letters` first and fall back to `settlements`.

function mapSettlementRowToLetter(r: any) {
  // Normalize different schemas into the frontend SettlementLetter shape
  if (!r) return null;
  if (r.contract_id || r.supplier_id) {
    return {
      id: String(r.id),
      supplierId: r.supplier_id != null ? String(r.supplier_id) : null,
      contractId: r.contract_id || (r.title || null),
      description: r.description || r.content || null,
      requestDate: r.request_date ? new Date(r.request_date).toISOString() : (r.date ? new Date(r.date).toISOString() : null),
      receivedDate: r.received_date ? new Date(r.received_date).toISOString() : null,
      status: r.status || 'Pendente',
      periodStartDate: r.period_start_date ? new Date(r.period_start_date).toISOString() : null,
      periodEndDate: r.period_end_date ? new Date(r.period_end_date).toISOString() : null,
    };
  }

  // fallback for settlement_letters minimal schema
  return {
    id: String(r.id),
    supplierId: null,
    contractId: r.title || null,
    description: r.content || null,
    requestDate: r.date ? new Date(r.date).toISOString() : null,
    receivedDate: null,
    status: 'Pendente',
    periodStartDate: null,
    periodEndDate: null,
  };
}

export async function GET() {
  try {
    // Try settlement_letters first
    try {
      // select structured columns so we can return supplierId and period directly
      const res = await db.query('SELECT id, title, content, date, supplier_id, period_start_date, period_end_date, status, received_date, file_url FROM settlement_letters ORDER BY date DESC');
      const rows = res.rows.map(mapSettlementRowToLetter);
      return NextResponse.json(rows);
    } catch (err) {
      // if the table doesn't exist, fall back to settlements
      console.debug('settlement_letters not available, falling back to settlements', (err as any)?.message || err);
    }

    const res2 = await db.query('SELECT * FROM settlements ORDER BY request_date DESC');
    const rows2 = res2.rows.map(mapSettlementRowToLetter);
    return NextResponse.json(rows2);
  } catch (err) {
    console.error('GET /api/settlements error', err);
    return NextResponse.json({ error: 'Failed to load settlements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id = `SET-${Date.now()}`,
      supplierId,
      contractId,
      description,
      periodStartDate,
      periodEndDate,
    } = body as any;

    if (!contractId) {
      return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
    }

    // Try to read supplier name for embedding in content (optional)
    let supplierName = '';
    if (supplierId) {
      try {
        const sRes = await db.query('SELECT id, name, cnpj FROM suppliers WHERE id = $1 LIMIT 1', [supplierId]);
        if (sRes.rows[0]) {
          supplierName = sRes.rows[0].name || '';
        }
      } catch (err) {
        // ignore
      }
    }

    // Build a content string that includes description, supplier and period so older schema still holds useful info
    const periodText = (periodStartDate && periodEndDate) ? `Período: ${new Date(periodStartDate).toLocaleDateString()} a ${new Date(periodEndDate).toLocaleDateString()}` : '';
    const contentParts = [];
    if (description) contentParts.push(description);
    if (supplierName) contentParts.push(`Fornecedor: ${supplierName}`);
    if (periodText) contentParts.push(periodText);
    const content = contentParts.join('\n\n');

      // Try insert into settlement_letters first (structured schema)
      try {
        // If settlement_letters has supplier_id/period columns, insert structured data
        const qCheck = `SELECT column_name FROM information_schema.columns WHERE table_name='settlement_letters' AND column_name IN ('supplier_id','period_start_date','period_end_date')`;
        const cRes = await db.query(qCheck);
        const hasStructured = cRes.rowCount >= 3;
        if (hasStructured) {
          const q = `INSERT INTO settlement_letters (title, content, date, supplier_id, period_start_date, period_end_date, status)
                      VALUES ($1,$2, now(), $3, $4, $5, 'Pendente') RETURNING id, title, content, date, supplier_id, period_start_date, period_end_date, status`;
          const vals = [contractId, content, supplierId || null, periodStartDate ? new Date(periodStartDate) : null, periodEndDate ? new Date(periodEndDate) : null];
          const res = await db.query(q, vals);
          const row = res.rows[0];
    const out = mapSettlementRowToLetter(row) || {} as any;
  out.supplierId = row.supplier_id != null ? String(row.supplier_id) : (supplierId != null ? String(supplierId) : null);
    out.periodStartDate = row.period_start_date ? new Date(row.period_start_date).toISOString() : (periodStartDate ? new Date(periodStartDate).toISOString() : null);
    out.periodEndDate = row.period_end_date ? new Date(row.period_end_date).toISOString() : (periodEndDate ? new Date(periodEndDate).toISOString() : null);
    out.description = description || out.description;
    return NextResponse.json(out, { status: 201 });
        }
        // fallback to minimal insert if structured not found
        const q = `INSERT INTO settlement_letters (title, content, date) VALUES ($1, $2, now()) RETURNING id, title, content, date`;
        const res = await db.query(q, [contractId, content]);
        const row = res.rows[0];
        const out = mapSettlementRowToLetter(row) || {} as any;
    out.supplierId = supplierId != null ? String(supplierId) : null;
        out.periodStartDate = periodStartDate ? new Date(periodStartDate).toISOString() : null;
        out.periodEndDate = periodEndDate ? new Date(periodEndDate).toISOString() : null;
        out.description = description || out.description;
        return NextResponse.json(out, { status: 201 });
      } catch (err) {
        console.debug('settlement_letters insert failed, trying settlements table', (err as any)?.message || err);
    }

    // Fallback: insert into settlements table (more fields)
    const query = `INSERT INTO settlements (id, supplier_id, contract_id, description, period_start_date, period_end_date, request_date, status)
      VALUES ($1,$2,$3,$4,$5,$6, now(), 'Pendente')
      ON CONFLICT (id) DO UPDATE SET supplier_id = EXCLUDED.supplier_id RETURNING *`;

    const values = [
      id,
      supplierId || null,
      contractId,
      description || null,
      periodStartDate ? new Date(periodStartDate) : null,
      periodEndDate ? new Date(periodEndDate) : null,
    ];

    const res = await db.query(query, values);
    const r = res.rows[0];
    const out = mapSettlementRowToLetter(r);
    return NextResponse.json(out, { status: 201 });
  } catch (err) {
    console.error('POST /api/settlements error', err);
    return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 });
  }
}
