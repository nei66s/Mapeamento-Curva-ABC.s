import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardAboutPage from '../dashboard/about/page';

export default async function AboutPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/about');
  }
  return <DashboardAboutPage />;
}
