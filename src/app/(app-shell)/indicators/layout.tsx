import requireAuthOrRedirect from '@/lib/server-auth-guard';

export default async function IndicatorsLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard for /indicators
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
      {children}
    </>
  );
}
