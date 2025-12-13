export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { listAccountRequests, setAccountRequestStatus, deleteAccountRequest } from '@/lib/account-requests.server';
import { createUser } from '@/lib/users.server';

function isAdminCookie(pm?: string | null) {
  if (!pm) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(pm));
    const role = parsed?.role;
    const permissions = parsed?.permissions || [];
    if (!role && (!permissions || permissions.length === 0)) return false;
    if (role === 'admin') return true;
    // fallback: allow users with users:manage permission
    if (Array.isArray(permissions) && permissions.includes('users:manage')) return true;
    return false;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  // auth: require admin
  const c = await cookies();
  const pm = c.get('pm_user')?.value;
  if (!isAdminCookie(pm)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await listAccountRequests();
    return NextResponse.json({ ok: true, result: data });
  } catch (err: any) {
    console.error('GET /api/admin-panel/account-requests error', err);
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const c = await cookies();
  const pm = c.get('pm_user')?.value;
  if (!isAdminCookie(pm)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    // Expected body: { action: 'approve'|'reject', id: string }
    if (!body || !body.action || !body.id) return NextResponse.json({ ok: false, error: 'Missing action or id' }, { status: 400 });
    const id = String(body.id);
    const action = String(body.action);

    if (action === 'approve') {
      // Fetch the request row (we rely on setAccountRequestStatus to return the row)
      const updated = await setAccountRequestStatus(id, 'approved');
      if (!updated) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });
      // create user from request
      let createdUser: any = null;
      let userCreationError: string | null = null;
      try {
        createdUser = await createUser({ name: updated.name, email: updated.email, role: 'visualizador' });
      } catch (e: any) {
        console.error('Failed creating user after approval', e);
        userCreationError = String(e?.message || e);
      }
      // send notification email if SMTP configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && createdUser) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: (process.env.SMTP_SECURE || 'false') === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });
          const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
          const appUrl = process.env.APP_URL || 'http://localhost:9002';
          const loginUrl = `${appUrl}/login`;
          await transporter.sendMail({
            from,
            to: updated.email,
            subject: 'Sua conta foi aprovada',
            text: `Olá ${updated.name || ''},\n\nSua solicitação de conta foi aprovada. Acesse ${loginUrl} para fazer login.`,
            html: `<p>Olá ${updated.name || ''},</p><p>Sua solicitação de conta foi aprovada. Acesse <a href="${loginUrl}">${loginUrl}</a> para fazer login.</p>`,
          });
        } catch (e) {
          console.error('account-requests: failed sending approval email', e);
        }
      }

      if (createdUser) {
        console.info('account-requests: user created after approval', {
          requestId: updated.id,
          userId: createdUser?.id,
          email: updated.email,
        });
      }
      if (userCreationError) {
        console.warn('account-requests: user creation failed after approval', {
          requestId: updated.id,
          error: userCreationError,
        });
      }
      return NextResponse.json({ ok: true, result: updated, createdUser: createdUser ? createdUser : null, userCreationError });
    }

    if (action === 'reject') {
      const updated = await setAccountRequestStatus(id, 'rejected');
      if (!updated) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 });
      return NextResponse.json({ ok: true, result: updated });
    }
    if (action === 'delete') {
      const deleted = await deleteAccountRequest(id);
      return NextResponse.json({ ok: true, result: { deleted } });
    }
    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/admin-panel/account-requests error', err);
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
