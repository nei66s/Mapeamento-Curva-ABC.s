import { User } from './types';
import pool from './db';

// Função para buscar todos os usuários
export async function getUsers(): Promise<User[]> {
  const res = await pool.query('SELECT * FROM users');
  return res.rows;
}

// Função para inserir um novo usuário
export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const res = await pool.query(
    'INSERT INTO users (name, email, role, password, avatarUrl) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [user.name, user.email, user.role, user.password, user.avatarUrl]
  );
  return res.rows[0];
}

// Função para atualizar um usuário existente
export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${idx++}`);
    values.push(updates.email);
  }
  if (updates.role !== undefined) {
    fields.push(`role = $${idx++}`);
    values.push(updates.role);
  }
  if (updates.password !== undefined) {
    fields.push(`password = $${idx++}`);
    values.push(updates.password);
  }
  if (updates.avatarUrl !== undefined) {
    fields.push(`avatarUrl = $${idx++}`);
    values.push(updates.avatarUrl);
  }

  if (fields.length === 0) return null;

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  values.push(id);

  const res = await pool.query(sql, values);
  return res.rows[0] || null;
}
