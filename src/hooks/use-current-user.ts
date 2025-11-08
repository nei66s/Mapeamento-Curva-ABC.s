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
      } else {
        localStorage.removeItem('pm_user');
      }
    } catch (err) {
      console.warn('Failed to persist pm_user', err);
    }
  }, []);

  return { user, setUser: persist, loading };
}

