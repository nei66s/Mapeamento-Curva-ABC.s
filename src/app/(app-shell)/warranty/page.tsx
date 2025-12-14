import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardWarrantyPage from '../dashboard/warranty/page';

export default async function WarrantyPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/warranty');
  }
  return <DashboardWarrantyPage />;
}
