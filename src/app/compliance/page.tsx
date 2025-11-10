import CompliancePageClient from '@/components/dashboard/compliance/compliance-page-client';

export default function Page(props: any) {
  // Keep this file a server component. Forward searchParams to the client component.
  return <CompliancePageClient searchParams={props?.searchParams} />;
}
