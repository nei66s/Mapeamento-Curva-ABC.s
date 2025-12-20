import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const ACCESS_EXP_SECONDS = Number(process.env.ACCESS_TOKEN_EXP_SECONDS || 60 * 60); // 1h
const REFRESH_EXP_SECONDS = Number(process.env.REFRESH_TOKEN_EXP_SECONDS || 60 * 60 * 24 * 7); // 7d
const MAX_CLOCK_SKEW_SECONDS = Number(process.env.JWT_MAX_CLOCK_SKEW_SECONDS ?? 60); // allowable clock skew in seconds

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function hmac(data: string) {
  return base64url(crypto.createHmac('sha256', SECRET).update(data).digest());
}

function sign(payload: Record<string, any>) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const sig = hmac(`${h}.${p}`);
  return `${h}.${p}.${sig}`;
}

function verify(token?: string | null) {
  if (!token) return { valid: false } as const;
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false } as const;
  const [h, p, sig] = parts;
  const expected = hmac(`${h}.${p}`);
  if (sig !== expected) return { valid: false } as const;
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf-8'));
    const nowSec = Math.floor(Date.now() / 1000);
    // expiration: allow a small clock skew; reject only if expired beyond skew
    if (payload.exp && payload.exp < nowSec - MAX_CLOCK_SKEW_SECONDS) return { valid: false } as const;
    // not-before: reject if token is not yet valid beyond allowed skew
    if (payload.nbf && payload.nbf > nowSec + MAX_CLOCK_SKEW_SECONDS) return { valid: false } as const;
    // issued-at: reject tokens that appear to be issued in the future beyond allowed skew
    if (payload.iat && payload.iat > nowSec + MAX_CLOCK_SKEW_SECONDS) return { valid: false } as const;
    return { valid: true as const, payload };
  } catch (e) {
    return { valid: false } as const;
  }
}

export function issueAccessToken(userId: string, role?: string) {
  const exp = Math.floor(Date.now() / 1000) + ACCESS_EXP_SECONDS;
  return sign({ sub: userId, role, exp, type: 'access' });
}

export function issueRefreshToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + REFRESH_EXP_SECONDS;
  return sign({ sub: userId, exp, type: 'refresh' });
}

export function verifyAccessToken(token?: string | null) {
  const res = verify(token);
  if (!res.valid) return { valid: false as const };
  const payload = res.payload as any;
  if (payload.type !== 'access' || !payload.sub) return { valid: false as const };
  return { valid: true as const, userId: payload.sub as string, role: payload.role as string, exp: payload.exp as number };
}

export function verifyRefreshToken(token?: string | null) {
  const res = verify(token);
  if (!res.valid) return { valid: false as const };
  const payload = res.payload as any;
  if (payload.type !== 'refresh' || !payload.sub) return { valid: false as const };
  return { valid: true as const, userId: payload.sub as string, exp: payload.exp as number };
}
