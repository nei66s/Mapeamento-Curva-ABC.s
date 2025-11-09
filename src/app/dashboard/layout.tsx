import AppHeader from "@/components/layout/app-header";
import AppSidebar from "@/components/layout/app-sidebar";
import RequirePermission from '@/components/auth/RequirePermission.client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
  <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-16">
        <AppHeader />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {/* Center content and limit width so pages don't stick to the right */}
          <div className="mx-auto w-full max-w-7xl">
            <RequirePermission>
              {children}
            </RequirePermission>
          </div>
        </main>
      </div>
    </div>
  );
}
