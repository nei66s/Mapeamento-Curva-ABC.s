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

  const inlineGuard = `
    (function(){
      try {
        var path = location.pathname || '/';
        var publicPaths = ['/login','/request-account','/forgot-password','/signup','/reset-password','/auth'];
        for (var i=0;i<publicPaths.length;i++) if (path.startsWith(publicPaths[i])) return;
        var cookies = document.cookie || '';
        if (!cookies.match(/(^|; )pm_user=|(^|; )pm_access_token=|next-auth.session-token=/)) {
          var url = '/login';
          try { url += '?returnTo=' + encodeURIComponent(path); } catch (e) {}
          location.replace(url);
        }
      } catch (e) {}
    })();
  `;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: inlineGuard }} />
      <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto w-full max-w-7xl">
          <RequirePermission>
            {children}
          </RequirePermission>
        </div>
      </main>
    </>
  );
}
