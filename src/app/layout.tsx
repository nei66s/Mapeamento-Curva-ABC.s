// Ensure client manifest fallback runs on server before other server code
import '@/lib/ensure-client-manifest.server';
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata } from 'next';
import './globals.css';
import { Inter, Lexend, Source_Code_Pro } from 'next/font/google';
// Font loaders must be called at module scope (Next.js requirement).
const inter = Inter({ subsets: ['latin'], weight: ['400','500','600','700'], display: 'swap' });
const lexend = Lexend({ subsets: ['latin'], weight: ['600','700','800'], display: 'swap' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], display: 'swap' });
import { Toaster } from '@/components/ui/toaster';
import LeftEdgeListener from '@/components/layout/left-edge-listener.client';
import { cookies } from 'next/headers';
import { getUserSettings } from '@/lib/settings.server';
import { AppProviders } from '@/components/providers/app-providers';

export const metadata: Metadata = {
  title: 'Manutenção',
  description: 'Plataforma de Gestão de Manutenção.',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'shortcut icon', url: '/favicon.ico' },
  ],
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      </head>
      <body className={`${inter.className} ${lexend.className} ${sourceCodePro.className} font-body antialiased`}>
        <AppProviders>
          <LeftEdgeListener threshold={48} />
          {children}
          <Toaster />
        </AppProviders>
        <SpeedInsights/>
      </body>
    </html>
  );
}
