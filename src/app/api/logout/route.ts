import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Clear common client-side/session cookies. Keep this list conservative and
  // add names used by your auth/session implementation if needed.
  const expired = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  res.headers.append('Set-Cookie', `pm_user=; Path=/; ${expired}; HttpOnly; SameSite=Lax`);
  res.headers.append('Set-Cookie', `session=; Path=/; ${expired}; HttpOnly; SameSite=Lax`);
  res.headers.append('Set-Cookie', `next-auth.session-token=; Path=/; ${expired}; HttpOnly; SameSite=Lax`);

  return res;
}
