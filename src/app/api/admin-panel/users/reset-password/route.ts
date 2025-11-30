import { NextRequest } from 'next/server';
import { json } from '../../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import pool from '@/lib/db';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const mod = await getModuleByKey('admin-users');
  if (mod && !mod.is_active) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const body = await request.json();
  const token = body.token;
  const newPassword = body.newPassword;
  if (!token || !newPassword) return json({ message: 'Token e nova senha são obrigatórios' }, 400);

  const tokenHash = createHash('sha256').update(String(token)).digest('hex');
  try {
    const res = await pool.query('SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used = false AND expires_at > now() LIMIT 1', [tokenHash]);
    if (!res.rowCount) return json({ message: 'Token inválido ou expirado' }, 400);
    const row = res.rows[0];
    const userId = String(row.user_id);

    // update user password
    const hashed = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, userId]);

    // mark token used
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [row.id]);

    return json({ message: 'Senha redefinida com sucesso' });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('reset-password error', e && (e as any).message ? (e as any).message : e);
    return json({ message: 'Erro ao redefinir senha' }, 500);
  }
}
