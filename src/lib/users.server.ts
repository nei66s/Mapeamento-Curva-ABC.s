import type { User } from './types';
import {
  getUserByEmail as adapterGetUserByEmail,
  getUserById as adapterGetUserById,
  listUsers as adapterListUsers,
  createUser as adapterCreateUser,
  updateUser as adapterUpdateUser,
  deleteUser as adapterDeleteUser,
} from '@/server/adapters/users-adapter';

function pickRow(row: any, keys: string[]) {
  for (const k of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, k) && row[k] != null) {
      return row[k];
    }
  }
  return undefined;
}

function mapUser(row: any): User {
  if (!row) return null as unknown as User;
  return {
    id: String(row.id),
    name: String(pickRow(row, ['name']) ?? ''),
    email: String(pickRow(row, ['email']) ?? ''),
    role: String(pickRow(row, ['role']) ?? 'visualizador') as User['role'],
    password: pickRow(row, ['password', 'password_hash']) ? String(pickRow(row, ['password', 'password_hash'])) : undefined,
    avatarUrl: (pickRow(row, ['avatarurl', 'avatar_url', 'avatarUrl']) as string | undefined) || undefined,
    supplierId: (pickRow(row, ['supplier_id', 'supplierid', 'supplier']) as string | undefined) || undefined,
    department: (pickRow(row, ['department', 'dept']) as string | undefined) || undefined,
  };
}

export async function getUsers(): Promise<User[]> {
  const rows = await adapterListUsers(10000, 0);
  return (rows || []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await adapterGetUserById(id);
  if (!row) return null;
  return mapUser(row);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const row = await adapterGetUserByEmail(email);
  if (!row) return null;
  return mapUser(row);
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const created = await adapterCreateUser({
    id: (user as any).id,
    name: user.name,
    email: user.email,
    password_hash: (user as any).password ?? null,
    role: user.role as string,
  });
  return mapUser(created as any);
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>) {
  const patch: any = {};
  if ((updates as any).name !== undefined) patch.name = (updates as any).name;
  if ((updates as any).email !== undefined) patch.email = (updates as any).email;
  if ((updates as any).role !== undefined) patch.role = (updates as any).role;
  if ((updates as any).password !== undefined) patch.password_hash = (updates as any).password;
  if ((updates as any).avatarUrl !== undefined) patch.avatar_url = (updates as any).avatarUrl;
  if ((updates as any).supplierId !== undefined) patch.supplier_id = (updates as any).supplierId;
  if ((updates as any).department !== undefined) patch.department = (updates as any).department;

  const updated = await adapterUpdateUser(id, patch as any);
  if (!updated) return null;
  return mapUser(updated as any);
}

export async function deleteUser(id: string): Promise<boolean> {
  return await adapterDeleteUser(id);
}
