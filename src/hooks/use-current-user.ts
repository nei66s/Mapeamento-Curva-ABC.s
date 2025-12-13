"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/types';

type CurrentUserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

function useCurrentUserInternal(): CurrentUserContextType {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('pm_user');
      if (raw) {
        try {
          setUserState(JSON.parse(raw));
        } catch (err) {
          console.warn('Failed to parse pm_user', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (detail) setUserState(detail as User);
        else setUserState(null);
      } catch (e) {
        // ignore
      }
    };
    const handleStorage = (ev: StorageEvent) => {
      try {
        if (ev.key !== 'pm_user') return;
        if (ev.newValue) {
          setUserState(JSON.parse(ev.newValue));
        } else {
          setUserState(null);
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('pm_user_changed', handler as EventListener);
    window.addEventListener('storage', handleStorage as any);
    return () => {
      window.removeEventListener('pm_user_changed', handler as EventListener);
      window.removeEventListener('storage', handleStorage as any);
    };
  }, []);

  const persist = useCallback((value: User | null) => {
    setUserState(value);
    try {
      if (typeof window === 'undefined') return;
      if (value) {
        localStorage.setItem('pm_user', JSON.stringify(value));
        try { window.dispatchEvent(new CustomEvent('pm_user_changed', { detail: value })); } catch (e) {}
        try {
          const cookieVal = encodeURIComponent(JSON.stringify({ id: value.id, role: value.role, name: value.name }));
          document.cookie = `pm_user=${cookieVal}; path=/; max-age=${60 * 60 * 24 * 7}`;
        } catch (e) {
          // ignore cookie set failures
        }
      } else {
        localStorage.removeItem('pm_user');
        try { window.dispatchEvent(new CustomEvent('pm_user_changed', { detail: null })); } catch (e) {}
        try {
          document.cookie = 'pm_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to persist pm_user', err);
    }
  }, []);

  return { user, setUser: persist, loading };
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const ctx = useCurrentUserInternal();
  return React.createElement(CurrentUserContext.Provider, { value: ctx }, children as any);
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within <CurrentUserProvider>');
  }
  return ctx;
}
