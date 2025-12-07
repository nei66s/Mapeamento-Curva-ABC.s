"use client";
import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AppSidebar from './app-sidebar';
import AppHeader from './app-header';
import RequirePermission from '@/components/auth/RequirePermission.client';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

export default function SidebarShell({ children }: { children: ReactNode }) {
  const pathname = usePathname?.() ?? '';
  // Simple opt-out for authentication pages where we don't want the app shell
  const authRoutes = ['/login', '/request-account', '/forgot-password', '/signup', '/reset-password'];
  const isAuthRoute = !!pathname && authRoutes.some((p) => pathname.startsWith(p));

  if (isAuthRoute) {
    // Render children without sidebar, header or left-edge strip to avoid shifting layout
    return (
      <div className="min-h-screen w-full bg-background">
        <main className="flex-1 px-4 py-6 sm:px-6 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="page-shell p-4 sm:p-6">
              <CurrentUserProvider>
                <RequirePermission>{children}</RequirePermission>
              </CurrentUserProvider>
            </div>
          </div>
        </main>
      </div>
    );
  }
  // Default to 'auto' for consistent initial render, then read persisted value after mount
  const [sidebarMode, setSidebarMode] = useState<'pinned' | 'auto'>('auto');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sidebarMode');
      if (raw === 'pinned' || raw === 'auto') setSidebarMode(raw);
    } catch (e) {
      // ignore
    }
  }, []);
  const [hoverVisible, setHoverVisible] = useState(false);
  const isOverSidebar = useRef(false);
  const isOverStrip = useRef(false);

  useEffect(() => {
    try { localStorage.setItem('sidebarMode', sidebarMode); } catch (e) {}
  }, [sidebarMode]);

  // Listen to global mouse movements to detect when cursor is near left edge.
  useEffect(() => {
    if (sidebarMode === 'pinned') return undefined;
    const threshold = 48;
    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      // debug: log mouse x for threshold testing (throttle to avoid spamming?)
      // eslint-disable-next-line no-console
      // console.log('sidebar-shell: mousemove x=', x);
      if (x <= threshold) {
        setHoverVisible(true);
      } else if (!isOverSidebar.current && !isOverStrip.current) {
        setHoverVisible(false);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [sidebarMode]);

  // Listen to global left-edge hover events emitted by LeftEdgeListener (if present)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail || typeof detail.near !== 'boolean') return;
        if (detail.near) {
          setHoverVisible(true);
        } else if (!isOverSidebar.current && !isOverStrip.current) {
          setHoverVisible(false);
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('left-edge-hover', handler as EventListener);
    return () => window.removeEventListener('left-edge-hover', handler as EventListener);
  }, []);

  const sidebarVisible = sidebarMode === 'pinned' || hoverVisible;

  // ensure the strip flag resets when the sidebar is visible so hover logic can re-close
  useEffect(() => {
    if (sidebarVisible) {
      isOverStrip.current = false;
    }
  }, [sidebarVisible]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        visible={sidebarVisible}
        onRequestClose={() => { setSidebarMode('auto'); setHoverVisible(false); }}
        onMouseEnter={() => {
          if (sidebarMode === 'auto') {
            isOverSidebar.current = true;
            setHoverVisible(true);
          }
        }}
        onMouseLeave={() => {
          if (sidebarMode === 'auto') {
            isOverSidebar.current = false;
            if (!isOverSidebar.current && !isOverStrip.current) {
              setHoverVisible(false);
            }
          }
        }}
      />
      {/* hover strip: when in auto mode, show a small left edge area to reveal sidebar */}
      {sidebarMode !== 'pinned' && (
        <div
          aria-hidden
          onMouseEnter={() => {
            isOverStrip.current = true;
            setHoverVisible(true);
          }}
          onMouseLeave={() => {
            isOverStrip.current = false;
            if (!isOverSidebar.current && !isOverStrip.current) {
              setHoverVisible(false);
            }
          }}
          className={cn(
            // reduced strip width to minimize accidental hover events
            'fixed left-0 top-0 h-full w-6 bg-white/6',
            // only capture pointer events when sidebar is not visible (so it doesn't block interactions)
            sidebarVisible ? 'pointer-events-none z-30' : 'pointer-events-auto z-50'
          )}
        />
      )}
      <div
        className={cn(
          'flex flex-1 flex-col gap-4 sm:gap-4 sm:py-4',
          // Reduce the left padding when sidebar is visible to make the page gutters smaller
          sidebarVisible ? 'sm:pl-[14rem]' : 'sm:pl-6'
        )}
      >
        <AppHeader
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => {
            // toggle between pinned and auto
            setSidebarMode(prev => (prev === 'pinned' ? 'auto' : 'pinned'));
          }}
          sidebarMode={sidebarMode}
          onSetSidebarMode={mode => {
            setSidebarMode(mode);
            if (mode !== 'auto') setHoverVisible(false);
          }}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="page-shell p-4 sm:p-6">
              <CurrentUserProvider>
                <RequirePermission>{children}</RequirePermission>
              </CurrentUserProvider>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
