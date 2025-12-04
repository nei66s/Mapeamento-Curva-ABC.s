import { NextRequest, NextResponse } from 'next/server';
import { json, getRequestIp } from '../../_utils';
import { logErrorToFile } from '@/server/error-logger';
import { getUserByEmail } from '@/server/adapters/users-adapter';
import { issueAccessToken, issueRefreshToken } from '@/lib/auth/jwt';
import { logAudit } from '@/server/adapters/audit-adapter';
import bcrypt from 'bcryptjs';

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Credenciais obrigatórias.' }, { status: 400 });
    }

    const user = await getUserByEmail(String(email).toLowerCase());
    if (!user) return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 401 });
    // status may be stored under different column names; adapters surface `status` when available
    if ((user as any).status === 'blocked') {
      return NextResponse.json({ message: 'Usuário bloqueado.' }, { status: 403 });
    }

    // If a password_hash exists, verify it. Otherwise allow DEFAULT_PASSWORD for local/dev.
    const stored = (user as any).password_hash || (user as any).password || null;
    let ok = false;
    try {
      if (stored) ok = await bcrypt.compare(password, stored);
      else ok = password === DEFAULT_PASSWORD;
    } catch (e) {
      ok = password === DEFAULT_PASSWORD;
    }

    if (!ok) return NextResponse.json({ message: 'Senha inválida.' }, { status: 401 });

    const accessToken = issueAccessToken(String(user.id), (user as any).role || undefined);
    const refreshToken = issueRefreshToken(String(user.id));

    const res = NextResponse.json({ user, accessToken, refreshToken, expiresIn: 3600 });
    res.cookies.set('pm_access_token', accessToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60, path: '/' });
    res.cookies.set('pm_refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/' });

    // record audit
    try {
      await logAudit({ user_id: String(user.id), entity: 'auth', entity_id: String(user.id), action: 'login', before_data: null, after_data: { success: true }, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
    } catch (e) {
      // ignore audit errors
    }

    return res;
  } catch (err: any) {
    // log details to file for later inspection
    try {
      await logErrorToFile({ message: err.message || 'login error', stack: err.stack, service: 'auth.login', meta: { body: await request.text(), ip: getRequestIp(request), ua: request.headers.get('user-agent') } });
    } catch (e) {
      // swallow
    }
    console.error('Auth login error', err);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
