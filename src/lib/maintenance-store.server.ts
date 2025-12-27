import fs from 'fs/promises';
import path from 'path';
import type { MaintenanceRow } from './maintenance-types';

const DATA_PATH = path.join(process.cwd(), 'tmp', 'maintenance-data.json');

async function ensureFile() {
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.access(DATA_PATH);
  } catch (e) {
    await fs.writeFile(DATA_PATH, '[]', 'utf-8');
  }
}

export async function getAllRows(): Promise<MaintenanceRow[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  try { return JSON.parse(raw) as MaintenanceRow[]; } catch { return []; }
}

export async function upsertRow(row: MaintenanceRow): Promise<MaintenanceRow> {
  const rows = await getAllRows();
  const idx = rows.findIndex(r => r.id === row.id);
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
  else rows.unshift(row);
  await fs.writeFile(DATA_PATH, JSON.stringify(rows, null, 2), 'utf-8');
  return row;
}

export async function createRow(partial: Partial<MaintenanceRow>): Promise<MaintenanceRow> {
  const id = partial.id ?? `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const row: MaintenanceRow = { id, ...partial } as MaintenanceRow;
  await upsertRow(row);
  return row;
}
