import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardUnsalvageablePage from '../dashboard/unsalvageable/page';

export default async function UnsalvageablePage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/unsalvageable');
  }
  return <DashboardUnsalvageablePage />;
}
