import pool from './db';
import type { RNC } from './types';

function pick(...keys: string[]) {
  return (row: any) => {
    for (const k of keys) {
      if (row == null) break;
      if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null) return row[k];
    }
    return null;
  };
}

export async function listRncs(): Promise<RNC[]> {
  try {
    const res = await pool.query(`SELECT * FROM rncs ORDER BY created_at DESC NULLS LAST`);
    const pickSupplier = pick('supplier_id', 'supplierId', 'supplier');
    const pickClassification = pick('classification');
    const pickIncident = pick('incident_id', 'incidentId', 'incident');
    const pickCreatedAt = pick('created_at', 'createdAt', 'opened_at');

    return res.rows.map((row: any) => ({
      id: String(row.id),
      title: row.title || row.nome || '',
      description: row.description || row.desc || '',
      status: row.status || 'Aberta',
      supplierId: String(pickSupplier(row) || ''),
      classification: (pickClassification(row) || 'Baixa') as any,
      incidentId: String(pickIncident(row) || '') || undefined,
      createdAt: pickCreatedAt(row) ? new Date(pickCreatedAt(row)).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('listRncs error', err);
    return [];
  }
}

export async function createRnc(data: Omit<RNC, 'id' | 'createdAt' | 'status'>): Promise<RNC | null> {
  try {
    // Try to insert with all extended columns; if the table doesn't have them, fallback is handled by catching the error
    const res = await pool.query(
      `INSERT INTO rncs (title, description, supplier_id, classification, incident_id, created_at, status)
       VALUES ($1,$2,$3,$4,$5, now(), 'Aberta') RETURNING *`,
      [data.title, data.description, data.supplierId || null, data.classification || 'Baixa', data.incidentId || null]
    );

    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      title: row.title || '',
      description: row.description || '',
      status: row.status || 'Aberta',
      supplierId: row.supplier_id || row.supplierId || '',
      classification: row.classification || 'Baixa',
      incidentId: row.incident_id || row.incidentId || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    } as RNC;
  } catch (err: any) {
    // If columns don't exist, try a minimal insert into title/description/status
    console.error('createRnc error', err);
    try {
      const fallback = await pool.query(
        `INSERT INTO rncs (title, description, status) VALUES ($1,$2,'Aberta') RETURNING *`,
        [data.title, data.description]
      );
      const row = fallback.rows[0];
      return {
        id: String(row.id),
        title: row.title || '',
        description: row.description || '',
        status: row.status || 'Aberta',
        supplierId: data.supplierId || '',
        classification: data.classification || 'Baixa',
        incidentId: data.incidentId || undefined,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      } as RNC;
    } catch (err2) {
      console.error('createRnc fallback error', err2);
      return null;
    }
  }
}

export async function createRncsBulk(items: Omit<RNC, 'id' | 'createdAt' | 'status'>[]): Promise<RNC[]> {
  const created: RNC[] = [];
  for (const it of items) {
    const c = await createRnc(it);
    if (c) created.push(c);
  }
  return created;
}

export async function updateRnc(id: string, data: Partial<Omit<RNC, 'id' | 'createdAt'>>): Promise<RNC | null> {
  try {
    const res = await pool.query(
      `UPDATE rncs SET title=$1, description=$2, supplier_id=$3, classification=$4, incident_id=$5 WHERE id=$6 RETURNING *`,
      [data.title, data.description, (data as any).supplierId || null, (data as any).classification || 'Baixa', (data as any).incidentId || null, id]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      title: row.title || '',
      description: row.description || '',
      status: row.status || 'Aberta',
      supplierId: row.supplier_id || (data as any).supplierId || '',
      classification: row.classification || (data as any).classification || 'Baixa',
      incidentId: row.incident_id || (data as any).incidentId || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    } as RNC;
  } catch (err) {
    console.error('updateRnc error', err);
    return null;
  }
}

export async function deleteRnc(id: string): Promise<boolean> {
  try {
    await pool.query(`DELETE FROM rncs WHERE id=$1`, [id]);
    return true;
  } catch (err) {
    console.error('deleteRnc error', err);
    return false;
  }
}
