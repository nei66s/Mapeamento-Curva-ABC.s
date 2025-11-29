'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { trackEvent } from '@/lib/tracking/client';

export function useAuth() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const loginFn = useAuthStore((state) => state.login);
  const logoutFn = useAuthStore((state) => state.logout);
  const refreshFn = useAuthStore((state) => state.refresh);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  const login = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: ({ email, password }: { email: string; password: string }) => loginFn(email, password),
    onSuccess: (u) => {
      queryClient.invalidateQueries({ queryKey: ['admin-session'] });
      trackEvent({ type: 'action', name: 'login', userId: u.id });
    },
  });

  const logout = useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: logoutFn,
    onSuccess: () => {
      queryClient.clear();
      trackEvent({ type: 'action', name: 'logout', userId: user?.id });
    },
  });

  const refresh = useCallback(() => refreshFn(), [refreshFn]);

  return {
    user,
    status,
    login,
    logout,
    refresh,
    bootstrap,
  };
}
