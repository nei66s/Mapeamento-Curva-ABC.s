import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardSettingsPage from '../dashboard/settings/page';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  if (
    !cookieStore.get('pm_user') &&
    !cookieStore.get('session') &&
    !cookieStore.get('next-auth.session-token')
  ) {
    redirect('/login?returnTo=/settings');
  }
  return <DashboardSettingsPage />;
}
