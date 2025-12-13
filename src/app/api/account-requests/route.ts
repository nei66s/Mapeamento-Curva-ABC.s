import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createAccountRequest, listAccountRequests } from '@/lib/account-requests.server';
import { getUserByEmail } from '@/lib/users.server';
import { ensureRateLimit } from '@/lib/account-requests-rate-limit';

function getClientKey(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}


export async function GET() {
  try {
    const data = await listAccountRequests();
    return NextResponse.json({ ok: true, result: data });
  } catch (err: any) {
    console.error('GET /api/account-requests error', err);
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const clientKey = getClientKey(req);
  if (!ensureRateLimit(clientKey)) {
    return NextResponse.json(
      { ok: false, error: 'Limite de tentativas atingido. Tente novamente em alguns segundos.' },
      { status: 429 }
    );
  }
  try {
    const body = await req.json();
    const honeypotValue = String(body?.honeypot || '').trim();
    if (honeypotValue) {
      console.warn('account-requests: honeypot triggered', { clientKey });
      return NextResponse.json(
        { ok: false, error: 'Detectamos atividade suspeita. Caso seja humano, limpe o formulário e tente novamente.' },
        { status: 400 }
      );
    }
    if (!body || !body.name || !body.email) return NextResponse.json({ ok: false, error: 'Nome e email são obrigatórios' }, { status: 400 });
    const name = String(body.name).trim();
    const email = String(body.email).trim().toLowerCase();
    const message = String(body.message || '').trim();

    if (name.length < 3) return NextResponse.json({ ok: false, error: 'Nome deve ter ao menos 3 caracteres' }, { status: 400 });
    if (!validateEmail(email)) return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });

    // prevent duplicate pending requests for the same email in last 24 hours
    const dupRes = await pool.query(`SELECT count(*) as c FROM account_requests WHERE email = $1 AND status = $2 AND requested_at > now() - interval '24 hours'`, [email, 'pending']);
    const dupCount = parseInt(String(dupRes.rows?.[0]?.c || '0'), 10);
    if (dupCount > 0) return NextResponse.json({ ok: false, error: 'Já existe uma solicitação pendente para este email. Aguarde aprovação.' }, { status: 429 });

    // do not allow requests for an email that already has a user
    const existing = await getUserByEmail(email);
    if (existing) return NextResponse.json({ ok: false, error: 'Já existe uma conta com este email' }, { status: 409 });

    const created = await createAccountRequest({ name, email, message });
    return NextResponse.json({ ok: true, result: created });
  } catch (err: any) {
    console.error('POST /api/account-requests error', err);
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
