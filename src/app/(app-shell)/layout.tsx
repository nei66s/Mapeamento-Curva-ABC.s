import type { ReactNode } from 'react';
import SidebarShell from '@/components/layout/sidebar-shell.client';
import requireAuthOrRedirect from '@/lib/server-auth-guard';

export default async function AppShellLayout({ children }: { children: ReactNode }) {
  await requireAuthOrRedirect();

  // Inline client-side guard script: runs before React hydration to avoid
  // a flash of protected content when the user is not authenticated.
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
      <SidebarShell>{children}</SidebarShell>
    </>
  );
}
