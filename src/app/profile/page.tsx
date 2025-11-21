import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardProfilePage from '../dashboard/profile/page';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/profile');
  }
  return <DashboardProfilePage />;
}
