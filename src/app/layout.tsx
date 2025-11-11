import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SidebarShell } from '@/components/layout/sidebar-shell';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Manutenção',
  description: 'Plataforma de Gestão de Manutenção.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en" suppressHydrationWarning>
      <head>
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

// SidebarShell is a client component moved to `components/layout/sidebar-shell.client.tsx`
