import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarShell } from '@/components/layout/sidebar-shell';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Manutenção',
  description: 'Plataforma de Gestão de Manutenção.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
                {/* Inline script to apply saved theme before React hydration to avoid FOUC */}
                <script dangerouslySetInnerHTML={{ __html: `
                  (function(){
                    try {
                      var theme = localStorage.getItem('theme') || 'light';
                      var color = localStorage.getItem('themeColor') || 'blue';
                      var tone = localStorage.getItem('themeTone') || 'soft';
                      if (color && color.endsWith('-vivid')) { tone = 'vivid'; color = color.replace(/-vivid$/, ''); }
                      var themeId = tone === 'vivid' ? color + '-vivid' : color;
                      if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
                      document.documentElement.setAttribute('data-theme', themeId);
                    } catch (e) { /* ignore */ }
                  })();
                ` }} />
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
        <SidebarShell>
          {children}
        </SidebarShell>
        <Toaster />
      </body>
    </html>
  );
}
