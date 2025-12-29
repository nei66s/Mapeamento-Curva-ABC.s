export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { issueAccessToken } from '@/lib/auth/jwt';

// Dev helper: issue an access token for a local admin user and set pm_access_token cookie.
// Enabled only when DEV_ALLOW_ADMIN_AUTOLOGIN=true in env.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'not_found' }, { status: 404 });
  }
  if (!process.env.DEV_ALLOW_ADMIN_AUTOLOGIN || process.env.DEV_ALLOW_ADMIN_AUTOLOGIN !== 'true') {
    return NextResponse.json({ message: 'not_allowed' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  try {
    let userRes;
    if (email) {
      userRes = await pool.query('select id, role, email from users where lower(email) = lower($1) limit 1', [email]);
    } else {
      userRes = await pool.query("select id, role, email from users where role = 'admin' or role = 'administrator' limit 1");
    }
    if (!userRes.rowCount) {
      return NextResponse.json({ message: 'admin_user_not_found' }, { status: 404 });
    }
    const user = userRes.rows[0];
    const token = issueAccessToken(user.id, user.role || 'admin');
    const res = NextResponse.json({ ok: true, token });
    // set cookie for local dev (not httpOnly so client JS can read when needed)
    res.cookies.set('pm_access_token', token, { httpOnly: false, path: '/', sameSite: 'lax', secure: false });
    return res;
  } catch (e: any) {
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
