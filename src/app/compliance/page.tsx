import CompliancePageClient from '@/components/dashboard/compliance/compliance-page-client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page(props: any) {
  // Server-side auth check: if no known session cookie is present, redirect
  // to login immediately so the client bundle for this page is never sent.
  const cookieStore = await cookies();
  const pmRaw = cookieStore.get('pm_user')?.value;
  const sessionRaw = cookieStore.get('session')?.value;
  const nextAuthRaw = cookieStore.get('next-auth.session-token')?.value;
  if (!pmRaw && !sessionRaw && !nextAuthRaw) {
    // Use a hard-coded returnTo for this specific route
    redirect('/login?returnTo=/compliance');
  }

  // Keep this file a server component. Forward searchParams to the client component.
  return <CompliancePageClient searchParams={props?.searchParams} />;
}
