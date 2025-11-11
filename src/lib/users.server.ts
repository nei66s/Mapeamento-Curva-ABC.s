import { User } from './types';
import pool from './db';

function pickRow(row: any, keys: string[]) {
  for (const k of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, k) && row[k] != null) {
      return row[k];
    }
  }
  return undefined;
}

function mapUser(row: any): User {
  return {
    id: String(row.id),
    name: String(pickRow(row, ['name']) ?? ''),
    email: String(pickRow(row, ['email']) ?? ''),
    role: String(pickRow(row, ['role']) ?? 'visualizador') as User['role'],
    password: pickRow(row, ['password']) ? String(pickRow(row, ['password'])) : undefined,
    avatarUrl: (pickRow(row, ['avatarurl', 'avatar_url', 'avatarUrl']) as string | undefined) || undefined,
    supplierId: (pickRow(row, ['supplier_id', 'supplierid', 'supplier']) as string | undefined) || undefined,
    department: (pickRow(row, ['department', 'dept']) as string | undefined) || undefined,
  };
}

async function getUserColumns(): Promise<string[]> {
  try {
    const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
    return res.rows.map((r: any) => String(r.column_name));
  } catch (err) {
    return [];
  }
}

export async function getUsers(): Promise<User[]> {
  // Use SELECT * to be resilient to column naming differences
  const res = await pool.query('SELECT * FROM users ORDER BY id ASC');
  return res.rows.map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  if (res.rowCount === 0) return null;
  return mapUser(res.rows[0]);
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const cols = await getUserColumns();
  // Map logical fields to existing column names
  const fieldMap: Record<string, string[]> = {
    name: ['name'],
    email: ['email'],
    role: ['role'],
    password: ['password'],
    avatarUrl: ['avatarUrl', 'avatar_url', 'avatarurl'],
    supplierId: ['supplier_id', 'supplierid', 'supplier'],
    department: ['department', 'dept'],
  };
  const insertCols: string[] = [];
  const values: any[] = [];
  let i = 1;
  const add = (logical: keyof typeof fieldMap, v: any) => {
    const actual = fieldMap[logical].find(c => cols.includes(c));
    if (actual) {
      insertCols.push(actual);
      values.push(v);
      return true;
    }
    return false;
  };
  add('name', user.name);
  add('email', user.email);
  add('role', user.role);
  add('password', user.password ?? '');
  add('avatarUrl', user.avatarUrl ?? null);
  add('supplierId', user.supplierId ?? null);
  add('department', user.department ?? null);

  if (insertCols.length === 0) {
    // As a last resort, try minimal insert with name/email
    const res = await pool.query(
      `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *`,
      [user.name, user.email]
    );
    return mapUser(res.rows[0]);
  }

  const placeholders = insertCols.map((_, idx) => `$${idx + 1}`).join(', ');
  const sql = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const res = await pool.query(sql, values);
  return mapUser(res.rows[0]);
}

// Função para atualizar um usuário existente, adaptando-se aos nomes de colunas
export async function updateUser(id: string, updates: Partial<Omit<User, 'id'> & { avatarUrl?: string | null }>): Promise<User | null> {
  const cols = await getUserColumns();
  if (cols.length === 0) return null;
  const map: Record<string, string[]> = {
    name: ['name'],
    email: ['email'],
    role: ['role'],
    password: ['password'],
    avatarUrl: ['avatarUrl', 'avatar_url', 'avatarurl'],
    supplierId: ['supplier_id', 'supplierid', 'supplier'],
    department: ['department', 'dept'],
  };
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  const setIfPresent = (logical: keyof typeof map, v: any) => {
    const actual = map[logical].find(c => cols.includes(c));
    if (actual) {
      fields.push(`${actual} = $${idx++}`);
      values.push(v);
    }
  };
  if (updates.name !== undefined) setIfPresent('name', updates.name);
  if (updates.email !== undefined) setIfPresent('email', updates.email);
  if (updates.role !== undefined) setIfPresent('role', updates.role);
  if (updates.password !== undefined) setIfPresent('password', updates.password);
  if (updates.avatarUrl !== undefined) setIfPresent('avatarUrl', updates.avatarUrl ?? null);
  if ((updates as any).supplierId !== undefined) setIfPresent('supplierId', (updates as any).supplierId ?? null);
  if (updates.department !== undefined) setIfPresent('department', updates.department ?? null);

  if (fields.length === 0) {
    // Nothing to update; return current row if exists
    const cur = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    if (cur.rowCount === 0) return null;
    return mapUser(cur.rows[0]);
  }

  values.push(id);
  const res = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  if (!res.rows[0]) return null;
  return mapUser(res.rows[0]);
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return res.rowCount > 0;
}
