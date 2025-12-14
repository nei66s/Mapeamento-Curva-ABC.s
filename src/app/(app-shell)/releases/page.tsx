import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardReleasesPage from '../dashboard/releases/page';

export default async function ReleasesPage() {
  const cookieStore = await cookies();
  if (
    !cookieStore.get('pm_user') &&
    !cookieStore.get('session') &&
    !cookieStore.get('next-auth.session-token')
  ) {
    redirect('/login?returnTo=/releases');
  }
  return <DashboardReleasesPage />;
}
