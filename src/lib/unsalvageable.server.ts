import pool from './db';
import type { UnsalvageableItem } from './types';

function mapRow(row: any): UnsalvageableItem {
  return {
    id: String(row.id),
    itemName: row.item_name || '',
    quantity: Number(row.quantity ?? 0),
    reason: row.reason || '',
    requestDate: row.request_date ? new Date(row.request_date).toISOString() : new Date().toISOString(),
    requesterId: row.requester_id || undefined,
    status: (row.status || 'Pendente') as UnsalvageableItem['status'],
    disposalDate: row.disposal_date ? new Date(row.disposal_date).toISOString() : undefined,
  };
}

type UnsalvageableInput = Omit<UnsalvageableItem, 'id' | 'status' | 'requestDate' | 'disposalDate'> & {
  status?: UnsalvageableItem['status'];
  requestDate?: string;
  disposalDate?: string | null;
};

export async function listUnsalvageable(): Promise<UnsalvageableItem[]> {
  const res = await pool.query('SELECT * FROM unsalvageable_items ORDER BY request_date DESC');
  return res.rows.map(mapRow);
}

export async function createUnsalvageable(data: UnsalvageableInput): Promise<UnsalvageableItem> {
  const res = await pool.query(
    `INSERT INTO unsalvageable_items (item_name, quantity, reason, request_date, requester_id, status, disposal_date)
     VALUES ($1,$2,$3,COALESCE($4, now()),$5,$6,$7)
     RETURNING *`,
    [
      data.itemName,
      data.quantity ?? 1,
      data.reason || '',
      data.requestDate || null,
      data.requesterId || null,
      data.status || 'Pendente',
      data.disposalDate || null,
    ]
  );
  return mapRow(res.rows[0]);
}

export async function createUnsalvageableBulk(items: UnsalvageableInput[]): Promise<UnsalvageableItem[]> {
  const created: UnsalvageableItem[] = [];
  for (const item of items) {
    created.push(await createUnsalvageable(item));
  }
  return created;
}

