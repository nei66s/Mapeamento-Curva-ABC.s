import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import SidebarShell from '@/components/layout/sidebar-shell.client';
import LeftEdgeListener from '@/components/layout/left-edge-listener.client';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getUserSettings } from '@/lib/settings.server';
import { AppProviders } from '@/components/providers/app-providers';

export const metadata: Metadata = {
  title: 'Manutenção',
  description: 'Plataforma de Gestão de Manutenção.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Try to read userId from cookie (set at login). If present, load server-side settings.
  let serverSettings = null;
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (userId) {
      serverSettings = await getUserSettings(String(userId));
    }
  } catch (e) {
    // ignore server-side read errors
    serverSettings = null;
  }

  // Serialize serverSettings safely
  const ss = serverSettings
    ? {
        theme: serverSettings.theme || null,
      }
    : null;

  // Inline script will prefer server-provided settings when available, otherwise fall back to localStorage.
  const inlineScript = `(function(){try{var server=${JSON.stringify(ss)};var stored=localStorage.getItem('theme')||'light';var prefer=(server&&server.theme)||stored;document.documentElement.classList.toggle('dark', prefer==='dark');document.documentElement.setAttribute('data-theme', prefer);localStorage.setItem('theme', prefer);}catch(e){}})();`;
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AppProviders>
          <LeftEdgeListener threshold={48} />
          <SidebarShell>
            {children}
          </SidebarShell>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
