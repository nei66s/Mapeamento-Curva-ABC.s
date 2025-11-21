import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server-side guard to require authentication. If no auth cookie is found
 * (pm_user, session or next-auth.session-token) or if `pm_user` is malformed,
 * this helper will redirect to `/login` immediately (server-side).
 */
export async function requireAuthOrRedirect() {
  try {
    const c = await cookies();
    const pm = c.get('pm_user')?.value;
    const session = c.get('session')?.value;
    const nextAuth = c.get('next-auth.session-token')?.value;
    if (!pm && !session && !nextAuth) {
      redirect('/login');
    }
    if (pm) {
      try {
        const parsed = JSON.parse(decodeURIComponent(pm));
        if (!(parsed && (parsed.id || parsed.role))) redirect('/login');
      } catch (e) {
        redirect('/login');
      }
    }
  } catch (e) {
    try { redirect('/login'); } catch (err) {}
  }
}

export default requireAuthOrRedirect;
