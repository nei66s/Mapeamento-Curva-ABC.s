"use client";
import React, { useState } from 'react';
import type { ReactNode } from 'react';
import AppSidebar from './app-sidebar';
import AppHeader from './app-header';
import RequirePermission from '@/components/auth/RequirePermission.client';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

export default function SidebarShell({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar visible={sidebarVisible} onRequestClose={() => setSidebarVisible(false)} />
      <div
        className={cn(
          'flex flex-1 flex-col gap-4 sm:gap-4 sm:py-4',
          sidebarVisible ? 'sm:pl-[18rem]' : 'sm:pl-6'
        )}
      >
        <AppHeader
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarVisible(prev => !prev)}
        />
        <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto w-full max-w-7xl">
            <CurrentUserProvider>
              <RequirePermission>{children}</RequirePermission>
            </CurrentUserProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
