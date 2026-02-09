import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const cookieStore = await cookies();
  // The login route sets `pm_user` (httpOnly) with basic user info. Use it
  // as the signal that the user is authenticated. Fall back to access token.
  const pmUserRaw = cookieStore.get('pm_user')?.value;
  console.debug('[page] cookies present', {
    pm_user: Boolean(pmUserRaw),
    pm_access_token: Boolean(cookieStore.get('pm_access_token')?.value),
  });
  let userId: string | undefined = undefined;
  if (pmUserRaw) {
    try {
      const decoded = decodeURIComponent(pmUserRaw);
      const parsed = JSON.parse(decoded);
      userId = parsed?.id;
    } catch (e) {
      userId = undefined;
    }
  }
  const hasAccessToken = Boolean(cookieStore.get('pm_access_token')?.value);

  if (!userId && !hasAccessToken) {
    redirect('/login?returnTo=/');
  }

  // If authenticated, send to default module/dashboard
  redirect('/indicators');
}
