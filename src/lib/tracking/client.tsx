'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { appConfig } from '../config';
import type { TrackingEventInput } from '@/types/admin';
import { getAccessToken } from '../auth/tokens';

function sendEvent(event: TrackingEventInput) {
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Prefer Beacon API to avoid blocking navigation when available.
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(appConfig.trackingEndpoint, blob);
    return;
  }

  fetch(appConfig.trackingEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Attach token for auditability; backend should validate.
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

export function trackEvent(event: TrackingEventInput) {
  try {
    sendEvent(event);
  } catch (e) {
    // swallow tracking errors
  }
}

export function trackPageView(route?: string, userId?: string) {
  try {
    const info = typeof navigator !== 'undefined'
      ? { device: navigator.platform, browser: navigator.userAgent }
      : { device: 'server', browser: 'server' };
    trackEvent({
      type: 'pageview',
      route,
      userId,
      ...info,
    });
  } catch (e) {
    // ignore
  }
}

export function TrackingProvider({
  children,
  userIdSelector,
}: {
  children: React.ReactNode;
  userIdSelector?: () => string | undefined | null;
}) {
  const pathname = usePathname();
  const uid = userIdSelector?.();
   const last = useRef<{ path?: string; userId?: string | null }>({});

  useEffect(() => {
    if (!pathname) return;
    const alreadyTrackedPath = last.current.path === pathname;
    const alreadyTrackedWithUser = alreadyTrackedPath && last.current.userId === (uid || null);
    if (alreadyTrackedWithUser) return;
    if (!alreadyTrackedPath || (uid && last.current.userId === null)) {
      trackPageView(pathname, uid || undefined);
      last.current = { path: pathname, userId: uid || null };
    }
  }, [pathname, uid]);

  return <>{children}</>;
}
