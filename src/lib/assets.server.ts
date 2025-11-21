import { randomUUID } from 'crypto';
import pool from './db';
import type { AssetRecord, AssetInsumo, AssetComponente } from './types';

type AssetRow = {
  id: string;
  store_id?: string | null;
  store_name?: string | null;
  name: string;
  patrimony?: string | null;
  hierarchy?: string | null;
  description?: string | null;
  complexity?: string | null;
  cost_estimate?: string | null;
  risk_notes?: string | null;
  insumos?: any;
  componentes?: any;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
};

function parseJsonArray(value: unknown): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return [];
    }
  }
  return [];
}

function mapAsset(row: AssetRow): AssetRecord {
  return {
    id: String(row.id),
    storeId: row.store_id || undefined,
    storeName: row.store_name || 'Sem loja',
    name: row.name,
    patrimony: row.patrimony || undefined,
    hierarchy: row.hierarchy || undefined,
    description: row.description || undefined,
    complexity: row.complexity || undefined,
    costEstimate: row.cost_estimate || undefined,
    riskNotes: row.risk_notes || undefined,
    insumos: parseJsonArray(row.insumos) as AssetInsumo[],
    componentes: parseJsonArray(row.componentes) as AssetComponente[],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export type AssetRecordInput = Omit<AssetRecord, 'id' | 'createdAt' | 'updatedAt'>;

export async function listAssetRecords(): Promise<AssetRecord[]> {
  try {
    const res = await pool.query('SELECT * FROM asset_inventory ORDER BY store_name NULLS LAST, name ASC');
    return res.rows.map(mapAsset);
  } catch (err) {
    if ((err as any)?.code === '42P01') {
      return [];
    }
    throw err;
  }
}

export async function getAssetById(id: string): Promise<AssetRecord | null> {
  const res = await pool.query('SELECT * FROM asset_inventory WHERE id = $1 LIMIT 1', [id]);
  if (res.rowCount === 0) return null;
  return mapAsset(res.rows[0]);
}

export async function createAssetRecord(data: AssetRecordInput): Promise<AssetRecord> {
  const id = `asset-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO asset_inventory
      (id, store_id, store_name, name, patrimony, hierarchy, description, complexity, cost_estimate, risk_notes, insumos, componentes)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      id,
      data.storeId || null,
      data.storeName || null,
      data.name,
      data.patrimony || null,
      data.hierarchy || null,
      data.description || null,
      data.complexity || null,
      data.costEstimate || null,
      data.riskNotes || null,
      JSON.stringify(data.insumos || []),
      JSON.stringify(data.componentes || []),
    ]
  );
  return mapAsset(res.rows[0]);
}

export async function updateAssetRecord(id: string, data: Partial<AssetRecordInput>): Promise<AssetRecord | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const push = (column: string, value: any) => {
    fields.push(`${column} = $${idx++}`);
    values.push(value);
  };

  if (data.storeId !== undefined) push('store_id', data.storeId || null);
  if (data.storeName !== undefined) push('store_name', data.storeName || null);
  if (data.name !== undefined) push('name', data.name);
  if (data.patrimony !== undefined) push('patrimony', data.patrimony || null);
  if (data.hierarchy !== undefined) push('hierarchy', data.hierarchy || null);
  if (data.description !== undefined) push('description', data.description || null);
  if (data.complexity !== undefined) push('complexity', data.complexity || null);
  if (data.costEstimate !== undefined) push('cost_estimate', data.costEstimate || null);
  if (data.riskNotes !== undefined) push('risk_notes', data.riskNotes || null);
  if (data.insumos !== undefined) push('insumos', JSON.stringify(data.insumos || []));
  if (data.componentes !== undefined) push('componentes', JSON.stringify(data.componentes || []));

  if (fields.length === 0) {
    return getAssetById(id);
  }

  values.push(id);
  const res = await pool.query(
    `UPDATE asset_inventory SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
    values
  );
  if (res.rowCount === 0) return null;
  return mapAsset(res.rows[0]);
}
