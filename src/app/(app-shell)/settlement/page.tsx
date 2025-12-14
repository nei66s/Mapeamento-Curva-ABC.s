import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardSettlementPage from '../dashboard/settlement/page';

export default async function SettlementPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/settlement');
  }
  return <DashboardSettlementPage />;
}
