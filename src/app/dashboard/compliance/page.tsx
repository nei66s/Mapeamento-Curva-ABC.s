
import CompliancePageClient from '@/components/dashboard/compliance/compliance-page-client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page(props: any) {
  const cookieStore = await cookies();
  const pmRaw = cookieStore.get('pm_user')?.value;
  const sessionRaw = cookieStore.get('session')?.value;
  const nextAuthRaw = cookieStore.get('next-auth.session-token')?.value;
  if (!pmRaw && !sessionRaw && !nextAuthRaw) {
    redirect('/login?returnTo=/dashboard/compliance');
  }

  // Keep this file a server component. Forward searchParams to the client component.
  return <CompliancePageClient searchParams={props?.searchParams} />;
}

    
