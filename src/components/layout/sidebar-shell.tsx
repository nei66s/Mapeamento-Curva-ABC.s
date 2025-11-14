'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import RequirePermission from '@/components/auth/RequirePermission.client';
import { usePathname } from 'next/navigation';
import MobileBottomNav from '@/components/layout/mobile-nav';

export function SidebarShell({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/login') ?? false;
  const STORAGE_KEY = 'app.sidebarVisible';
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        setSidebarVisible(raw === 'true');
      }
    } catch (err) {
      // ignore localStorage errors
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, sidebarVisible ? 'true' : 'false');
    } catch (err) {
      // ignore write errors
    }
  }, [sidebarVisible]);
  useEffect(() => {
    const handleOverflow = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      if (sidebarVisible && mobile) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };
    handleOverflow();
    window.addEventListener('resize', handleOverflow);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleOverflow);
    };
  }, [sidebarVisible]);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(max-width: 767px)');
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    if (media.addEventListener) {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
    media.addListener(handler);
    return () => media.removeListener(handler);
  }, []);
  if (isAuthRoute) {
    return <CurrentUserProvider>{children}</CurrentUserProvider>;
  }
  return (
    <div className={cn('flex min-h-screen w-full bg-background', sidebarVisible ? 'lg:overflow-x-hidden' : '')}>
      <AppSidebar visible={sidebarVisible} onRequestClose={() => setSidebarVisible(false)} />
      <div
        className={cn(
          'flex flex-1 flex-col gap-4 sm:gap-4 sm:py-4',
          // on large screens reserve space when sidebar is visible; when hidden occupy full width
          sidebarVisible ? 'lg:pl-[18rem]' : 'lg:pl-0'
        )}
      >
        <AppHeader
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarVisible(prev => !prev)}
        />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className={cn('w-full max-w-7xl mx-auto', sidebarVisible ? 'lg:mx-0' : '')}>
            <CurrentUserProvider>
              <RequirePermission>{children}</RequirePermission>
            </CurrentUserProvider>
          </div>
        </main>
      </div>
      {hasMounted && isMobile && (
        <div className="lg:hidden">
          <MobileBottomNav />
        </div>
      )}
    </div>
  );
}
