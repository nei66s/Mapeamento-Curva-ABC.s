"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { NotificationPayload, NotificationRecord } from '@/lib/types';

export function useNotifications() {
  const { user } = useCurrentUser();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}&limit=25`);
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Não foi possível carregar notificações.');
      }
      setNotifications(body.notifications ?? []);
    } catch (err) {
      console.error('useNotifications fetch failed', err);
      setError((err as Error)?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!user?.id) return;
      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, id: notificationId }),
        });
        if (!res.ok) throw new Error('Falha ao marcar como lido');
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
          )
        );
      } catch (err) {
        console.error('markAsRead failed', err);
      }
    },
    [user?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, markAll: true }),
      });
      if (!res.ok) throw new Error('Falha ao marcar todas as notificações como lidas');
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, readAt: now })));
    } catch (err) {
      console.error('markAllAsRead failed', err);
    }
  }, [user?.id]);

  const pushNotification = useCallback(
    async (payload: NotificationPayload) => {
      if (!user?.id) return;
      try {
        const res = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...payload }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || 'Falha ao criar notificação');
        }
        await fetchNotifications();
      } catch (err) {
        console.error('pushNotification failed', err);
      }
    },
    [user?.id, fetchNotifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter(({ readAt }) => readAt === null).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    pushNotification,
  };
}
