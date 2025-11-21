import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReportsPage from '@/components/dashboard/reports/page';

export const metadata = {
  title: 'Laudos Técnicos',
};

export default async function Page() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/dashboard/reports');
  }
  return <ReportsPage />;
}
