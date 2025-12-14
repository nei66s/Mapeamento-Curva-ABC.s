import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardMatrixPage from '../dashboard/matrix/page';

export default async function MatrixPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/matrix');
  }
  return <DashboardMatrixPage />;
}
