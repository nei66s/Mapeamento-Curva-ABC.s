import RequirePermission from '@/components/auth/RequirePermission.client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
