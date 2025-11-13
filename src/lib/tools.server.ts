import { randomUUID } from 'crypto';
import pool from './db';
import type { Tool, ToolStatus } from './types';

type ToolRow = {
  id: any;
  name: string;
  category: Tool['category'];
  serial_number?: string | null;
  status: ToolStatus;
  assigned_to?: string | null;
  purchase_date?: Date | string | null;
  last_maintenance?: Date | string | null;
};

function mapTool(row: ToolRow): Tool {
  return {
    id: String(row.id),
    name: row.name,
    category: row.category,
    serialNumber: row.serial_number || undefined,
    status: (row.status || 'Disponível') as ToolStatus,
    assignedTo: row.assigned_to || undefined,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date).toISOString() : new Date().toISOString(),
    lastMaintenance: row.last_maintenance ? new Date(row.last_maintenance).toISOString() : undefined,
  };
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ToolInput = Omit<Tool, 'id'> & { id?: string };

export async function listTools(): Promise<Tool[]> {
  // Some DB instances don't have a `created_at` column on `tools`.
  // Order by `name` as a safe default to avoid SQL errors.
  const res = await pool.query('SELECT * FROM tools ORDER BY name ASC');
  return res.rows.map(mapTool);
}

export async function createTool(data: ToolInput): Promise<Tool> {
  const id = data.id ?? `tool-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO tools (id, name, category, serial_number, status, assigned_to, purchase_date, last_maintenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        serial_number = EXCLUDED.serial_number,
        status = EXCLUDED.status,
        assigned_to = EXCLUDED.assigned_to,
        purchase_date = EXCLUDED.purchase_date,
        last_maintenance = EXCLUDED.last_maintenance
     RETURNING *`,
    [
      id,
      data.name,
      data.category,
      data.serialNumber || null,
      data.status || 'Disponível',
      data.assignedTo || null,
      parseDate(data.purchaseDate),
      parseDate(data.lastMaintenance || null),
    ]
  );
  return mapTool(res.rows[0]);
}

export async function createToolsBulk(items: ToolInput[]): Promise<Tool[]> {
  const created: Tool[] = [];
  for (const item of items) {
    const result = await createTool(item);
    created.push(result);
  }
  return created;
}

export async function updateTool(id: string, data: Partial<ToolInput>): Promise<Tool | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  const push = (sql: string, value: any) => {
    fields.push(`${sql} = $${idx++}`);
    values.push(value);
  };

  if (data.name !== undefined) push('name', data.name);
  if (data.category !== undefined) push('category', data.category);
  if (data.serialNumber !== undefined) push('serial_number', data.serialNumber || null);
  if (data.status !== undefined) push('status', data.status);
  if (data.assignedTo !== undefined) push('assigned_to', data.assignedTo || null);
  if (data.purchaseDate !== undefined) push('purchase_date', parseDate(data.purchaseDate));
  if (data.lastMaintenance !== undefined) push('last_maintenance', parseDate(data.lastMaintenance));

  if (fields.length === 0) return getTool(id);

  values.push(id);
  const res = await pool.query(
    `UPDATE tools SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (res.rowCount === 0) return null;
  return mapTool(res.rows[0]);
}

export async function getTool(id: string): Promise<Tool | null> {
  const res = await pool.query('SELECT * FROM tools WHERE id = $1 LIMIT 1', [id]);
  if (res.rowCount === 0) return null;
  return mapTool(res.rows[0]);
}

export async function deleteTool(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM tools WHERE id = $1', [id]);
  return res.rowCount > 0;
}

