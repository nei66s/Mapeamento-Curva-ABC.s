"use client";

import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { HistoryPayload, UserHistoryEntry } from '@/lib/types';

export function useUserHistory() {
  const { user } = useCurrentUser();
  const [history, setHistory] = useState<UserHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/history?userId=${encodeURIComponent(user.id)}&limit=30`);
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Falha ao carregar histórico');
      }
      setHistory(body.history ?? []);
    } catch (err) {
      console.error('useUserHistory fetch failed', err);
      setError((err as Error)?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const log = useCallback(
    async (payload: HistoryPayload) => {
      if (!user?.id) return;
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...payload }),
        });
        await fetchHistory();
      } catch (err) {
        console.error('Failed to log history', err);
      }
    },
    [user?.id, fetchHistory]
  );

  return {
    history,
    loading,
    error,
    refresh: fetchHistory,
    log,
  };
}
