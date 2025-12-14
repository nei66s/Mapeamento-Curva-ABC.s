import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardCategoriesPage from '../dashboard/categories/page';

export default async function CategoriesPage() {
  const cookieStore = await cookies();
  if (
    !cookieStore.get('pm_user') &&
    !cookieStore.get('session') &&
    !cookieStore.get('next-auth.session-token')
  ) {
    redirect('/login?returnTo=/categories');
  }
  return <DashboardCategoriesPage />;
}
