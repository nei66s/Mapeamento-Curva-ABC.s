import { NextRequest } from 'next/server';
import { json, isModuleActive } from '../../_utils';
import pool from '@/lib/db';
import { getUserByEmail } from '@/server/adapters/users-adapter';
import nodemailer from 'nodemailer';
import { randomBytes, createHash } from 'crypto';

export async function POST(request: NextRequest) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const body = await request.json();
  const email = (body.email || '').toLowerCase();
  if (!email) return json({ message: 'Email é obrigatório' }, 400);

  const user = await getUserByEmail(email);
  if (!user) return json({ message: 'Usuário não encontrado' }, 404);

  // ensure tokens table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id serial PRIMARY KEY,
      user_id text NOT NULL,
      token_hash text NOT NULL,
      expires_at timestamptz NOT NULL,
      used boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    )
  `);

  const token = randomBytes(24).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await pool.query('INSERT INTO password_reset_tokens(user_id, token_hash, expires_at) VALUES($1,$2,$3)', [String(user.id), tokenHash, expiresAt.toISOString()]);

  const appUrl = process.env.APP_URL || 'http://localhost:9002';
  const resetUrl = `${appUrl}/admin/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  // try to send email if SMTP configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: (process.env.SMTP_SECURE || 'false') === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Redefinição de senha',
        text: `Olá ${user.name || ''},\n\nSolicitamos a redefinição de senha da sua conta. Acesse o link abaixo para criar uma nova senha (válido por 1 hora):\n\n${resetUrl}\n\nSe você não solicitou, ignore esta mensagem.`,
        html: `<p>Olá ${user.name || ''},</p><p>Siga o link para redefinir sua senha (válido por 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
      return json({ message: 'Email de redefinição enviado.' });
    } catch (e) {
      // log and fallback to returning token in dev
      // eslint-disable-next-line no-console
      console.error('send-reset email error', e && (e as any).message ? (e as any).message : e);
      if (process.env.NODE_ENV !== 'production') return json({ message: 'SMTP falhou, token (dev):', token, resetUrl });
      return json({ message: 'Falha ao enviar email de redefinição' }, 500);
    }
  }

  // no SMTP configured — return token in response in dev
  if (process.env.NODE_ENV !== 'production') return json({ message: 'SMTP não configurado — token (dev):', token, resetUrl });
  return json({ message: 'Email de redefinição não configurado' }, 500);
}
