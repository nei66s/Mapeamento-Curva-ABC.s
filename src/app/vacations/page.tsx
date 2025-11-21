import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardVacationsPage from '../dashboard/vacations/page';

export default async function VacationsPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/vacations');
  }
  return <DashboardVacationsPage />;
}
