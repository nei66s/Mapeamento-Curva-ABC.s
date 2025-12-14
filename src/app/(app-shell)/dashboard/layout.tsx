import RequirePermission from '@/components/auth/RequirePermission.client';
import requireAuthOrRedirect from '@/lib/server-auth-guard';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: await the helper so unauthenticated requests are
  // redirected before the server renders any protected UI.
  await requireAuthOrRedirect();

  return (
    <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto w-full max-w-7xl">
        <RequirePermission>
          {children}
        </RequirePermission>
      </div>
    </main>
  );
}
