import requireAuthOrRedirect from '@/lib/server-auth-guard';

export default async function IndicatorsLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard for /indicators
  await requireAuthOrRedirect();

  return <>{children}</>;
}
