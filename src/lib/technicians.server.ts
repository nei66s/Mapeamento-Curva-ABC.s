import { randomUUID } from 'crypto';
import pool from './db';
import type { Technician } from './types';

function normalize(row: any): Technician {
  return {
    id: String(row.id),
    name: row.name || '',
    role: row.role || row.funcao || undefined,
  };
}

export async function listTechnicians(): Promise<Technician[]> {
  const res = await pool.query('SELECT id, name, role FROM technicians ORDER BY name ASC');
  return res.rows.map(normalize);
}

export type TechnicianInput = {
  id?: string;
  name: string;
  role?: string | null;
};

export async function createTechnician(data: TechnicianInput): Promise<Technician> {
  const id = data.id ?? `tech-${randomUUID()}`;
  const res = await pool.query(
    `INSERT INTO technicians (id, name, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
     RETURNING id, name, role`,
    [id, data.name, data.role ?? null]
  );
  return normalize(res.rows[0]);
}

export async function deleteTechnician(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM technicians WHERE id = $1', [id]);
  return res.rowCount > 0;
}

