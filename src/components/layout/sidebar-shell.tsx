'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import RequirePermission from '@/components/auth/RequirePermission.client';

export function SidebarShell({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  useEffect(() => {
    // Prevent body scroll when sidebar is open in mobile overlay mode
    const handleOverflow = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024; // lg breakpoint ~1024px
      if (sidebarVisible && isMobile) {
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
    </div>
  );
}
