'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TrackingProvider } from '@/lib/tracking/client';
import { useAuthStore } from '@/lib/auth/store';

function AuthBootstrapper() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  useEffect(() => {
    bootstrap().catch(() => {});
  }, [bootstrap]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            staleTime: 15_000,
            retry: 2,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = () => focusManager.setFocused(true);
    const onBlur = () => focusManager.setFocused(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <QueryClientProvider client={client}>
      <AuthBootstrapper />
      <TrackingProvider userIdSelector={() => useAuthStore.getState().user?.id}>
        {children}
      </TrackingProvider>
      {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
