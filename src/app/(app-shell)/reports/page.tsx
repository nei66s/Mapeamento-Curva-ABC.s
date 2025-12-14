import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardReportsPage from '../dashboard/reports/page';

export default async function ReportsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/reports');
  }
  return <DashboardReportsPage />;
}
