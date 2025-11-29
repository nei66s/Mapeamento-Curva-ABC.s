'use client';

import { useCallback } from 'react';
import { trackEvent, trackPageView } from '@/lib/tracking/client';
import { useAuthStore } from '@/lib/auth/store';

export function useTracking() {
  const userId = useAuthStore((state) => state.user?.id);

  const trackAction = useCallback(
    (name: string, payload?: Record<string, unknown>) =>
      trackEvent({ type: 'action', name, payload, userId: userId || undefined }),
    [userId]
  );

  const trackView = useCallback(
    (route?: string) => trackPageView(route, userId || undefined),
    [userId]
  );

  return { trackAction, trackView };
}
