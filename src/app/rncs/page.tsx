import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardRncsPage from '../dashboard/rncs/page';

export default async function RncsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/rncs');
  }
  return <DashboardRncsPage />;
}
