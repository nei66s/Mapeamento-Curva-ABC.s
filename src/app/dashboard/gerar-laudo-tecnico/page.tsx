import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TechnicalEvaluationPage from '@/components/dashboard/technical-evaluation/page'

// Keep this as a server component that renders the client-side TechnicalEvaluationPage
export default async function Page() {
  const cookieStore = await cookies();
  if (!cookieStore.get('pm_user') && !cookieStore.get('session') && !cookieStore.get('next-auth.session-token')) {
    redirect('/login?returnTo=/dashboard/gerar-laudo-tecnico');
  }
  return <TechnicalEvaluationPage />
}
