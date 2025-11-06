
import type { FC } from 'react';
import CompliancePageClient from '@/components/dashboard/compliance/compliance-page-client';

type Props = {
  searchParams?: Record<string, any>;
};

const Page: FC<Props> = ({ searchParams }) => {
  // Keep this file a server component. Forward searchParams to the client component.
  return <CompliancePageClient searchParams={searchParams} />;
};

export default Page;

    
