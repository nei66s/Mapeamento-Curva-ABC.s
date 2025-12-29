export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  // Clear common client-side/session cookies. Keep this list conservative and
  // add names used by your auth/session implementation if needed.
  const expired = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  res.headers.append('Set-Cookie', `pm_user=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secure}`);
  res.headers.append('Set-Cookie', `pm_access_token=; Path=/; ${expired}; SameSite=Lax${secure}`);
  res.headers.append('Set-Cookie', `pm_refresh_token=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secure}`);
  res.headers.append('Set-Cookie', `session=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secure}`);
  res.headers.append('Set-Cookie', `next-auth.session-token=; Path=/; ${expired}; HttpOnly; SameSite=Lax${secure}`);

  return res;
}
