import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarShell } from '@/components/layout/sidebar-shell';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { getUserSettings } from '@/lib/settings.server';
import { getSeasonSnapshot } from '@/lib/season';
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
        themeColor: serverSettings.themeColor || null,
        themeTone: serverSettings.themeTone || null,
      }
    : null;
  const seasonalTheme = getSeasonSnapshot().theme;

  // Provide raw seasonal tokens to the client. The inline script will compute
  // final `--*-foreground` fallbacks while taking into account whether dark
  // mode is active on the client, avoiding dark text on dark backgrounds.
  const seasonalRawVars = {
    '--primary': seasonalTheme.primary,
    '--primary-foreground': seasonalTheme.primaryForeground,
    '--background': seasonalTheme.background,
    '--foreground': seasonalTheme.foreground,
    '--card': seasonalTheme.card,
    '--card-foreground': seasonalTheme.cardForeground,
    '--muted': seasonalTheme.muted,
    '--muted-foreground': seasonalTheme.mutedForeground,
    '--hero-from': seasonalTheme.heroFrom,
    '--hero-via': seasonalTheme.heroVia,
    '--hero-to': seasonalTheme.heroTo,
    '--border': seasonalTheme.border,
    '--ring': seasonalTheme.ring,
  };

  // Inline script will prefer server-provided settings when available, otherwise fall back to localStorage/prefers-color-scheme.
  const inlineScript = `(function(){try{var server=${JSON.stringify(ss)};var color=(server&&server.themeColor)||localStorage.getItem('themeColor')||'blue';var tone=(server&&server.themeTone)||localStorage.getItem('themeTone')||'soft';if(color&&color.endsWith('-vivid')){tone='vivid';color=color.replace(/-vivid$/,'');}var themeId=(tone==='vivid')?color+'-vivid':color;if(server&&server.theme==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme',themeId);if(color==='seasonal'){var seasonalRaw=document.documentElement.getAttribute('data-seasonal');if(seasonalRaw){try{var parsed=JSON.parse(seasonalRaw);Object.entries(parsed).forEach(function(e){if(e[1])document.documentElement.style.setProperty(e[0],e[1]);});document.documentElement.setAttribute('data-theme','seasonal');}catch(e){}}}try{localStorage.setItem('theme',(server&&server.theme)||localStorage.getItem('theme')||'light');localStorage.setItem('themeColor',color);localStorage.setItem('themeTone',tone);}catch(e){} }catch(e){}})();`;
  return (
    <html lang="en" suppressHydrationWarning data-seasonal={JSON.stringify(seasonalRawVars)}>
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
          <SidebarShell>
            {children}
          </SidebarShell>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
