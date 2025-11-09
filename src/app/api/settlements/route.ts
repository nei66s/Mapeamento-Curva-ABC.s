import { NextResponse } from 'next/server';
import db from '@/lib/db';

function mapSettlementRowToLetter(r: any) {
  if (!r) return null;
  return {
    id: String(r.id),
    supplierId: r.supplier_id != null ? String(r.supplier_id) : null,
    contractId: r.title || r.contract_id || null,
    description: r.description || r.content || null,
    requestDate: r.date ? new Date(r.date).toISOString() : null,
    receivedDate: r.received_date ? new Date(r.received_date).toISOString() : null,
    status: r.status || 'Pendente',
    periodStartDate: r.period_start_date ? new Date(r.period_start_date).toISOString() : null,
    periodEndDate: r.period_end_date ? new Date(r.period_end_date).toISOString() : null,
    fileUrl: r.file_url || null,
  };
}

export async function GET() {
  try {
    const res = await db.query('SELECT id, title, content, date, supplier_id, period_start_date, period_end_date, status, received_date, file_url FROM settlement_letters ORDER BY date DESC');
    const rows = res.rows.map(mapSettlementRowToLetter);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/settlements error', err);
    return NextResponse.json({ error: 'Failed to load settlements' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      supplierId,
      contractId,
      description,
      periodStartDate,
      periodEndDate,
    } = body as any;

    if (!contractId) {
      return NextResponse.json({ error: 'contractId is required' }, { status: 400 });
    }

    let supplierName = '';
    if (supplierId) {
      try {
        const sRes = await db.query('SELECT name FROM suppliers WHERE id = $1 LIMIT 1', [supplierId]);
        if (sRes.rows[0]) supplierName = sRes.rows[0].name || '';
      } catch (err) {
        // ignore
      }
    }

    const periodText = (periodStartDate && periodEndDate)
      ? `Período: ${new Date(periodStartDate).toLocaleDateString()} a ${new Date(periodEndDate).toLocaleDateString()}`
      : '';
    const contentParts = [];
    if (description) contentParts.push(description);
    if (supplierName) contentParts.push(`Fornecedor: ${supplierName}`);
    if (periodText) contentParts.push(periodText);
    const content = contentParts.join('\n\n');

    const q = `INSERT INTO settlement_letters (title, content, date, supplier_id, period_start_date, period_end_date, status)
               VALUES ($1,$2, now(), $3, $4, $5, 'Pendente')
               RETURNING id, title, content, date, supplier_id, period_start_date, period_end_date, status`;
    const vals = [
      contractId,
      content,
      supplierId || null,
      periodStartDate ? new Date(periodStartDate) : null,
      periodEndDate ? new Date(periodEndDate) : null,
    ];
    const res = await db.query(q, vals);
    const row = res.rows[0];
    const out = mapSettlementRowToLetter(row);
    if (out && description) out.description = description;
    return NextResponse.json(out, { status: 201 });
  } catch (err) {
    console.error('POST /api/settlements error', err);
    return NextResponse.json({ error: 'Failed to create settlement' }, { status: 500 });
  }
}
