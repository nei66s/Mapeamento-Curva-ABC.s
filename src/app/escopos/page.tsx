import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EscoposPageClient from '@/components/escopos/escopos-page-client';

export default async function Page() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/escopos');
  }
  return <EscoposPageClient />;
}
