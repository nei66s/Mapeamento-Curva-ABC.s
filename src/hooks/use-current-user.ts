import { useEffect, useState, useCallback } from 'react';
import type { User } from '@/lib/types';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('pm_user');
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch (err) {
          console.warn('Failed to parse pm_user', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((value: User | null) => {
    setUser(value);
    try {
      if (typeof window === 'undefined') return;
      if (value) {
        localStorage.setItem('pm_user', JSON.stringify(value));
        try {
          // also persist a cookie so server-side middleware can read role
          const cookieVal = encodeURIComponent(JSON.stringify({ id: value.id, role: value.role, name: value.name }));
          // set cookie for 7 days
          document.cookie = `pm_user=${cookieVal}; path=/; max-age=${60 * 60 * 24 * 7}`;
        } catch (e) {
          // ignore cookie set failures
        }
      } else {
        localStorage.removeItem('pm_user');
        try {
          // remove cookie
          document.cookie = 'pm_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to persist pm_user', err);
    }
  }, []);

  return { user, setUser: persist, loading };
}

