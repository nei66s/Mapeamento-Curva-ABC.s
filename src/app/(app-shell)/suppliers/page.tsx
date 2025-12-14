import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardSuppliersPage from '../dashboard/suppliers/page';

export default async function SuppliersPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/suppliers');
  }
  return <DashboardSuppliersPage />;
}
