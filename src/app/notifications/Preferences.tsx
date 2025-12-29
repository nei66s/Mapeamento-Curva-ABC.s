"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Notification = { id: number; title: string; message?: string; read: boolean };

export default function Preferences() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId] = useState('1');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const json = await res.json();
      setNotifications(json.notifications ?? []);
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function markAllRead() {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, markAll: true }) });
      void fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="mb-3">
        <Button size="sm" onClick={markAllRead}>
          Marcar todas como lidas
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma notificação encontrada.</div>}
        {notifications.map((n) => (
          <div key={n.id} className={cn('surface-outline p-3', n.read ? 'bg-muted/30' : 'bg-card')}>
            <div className="font-semibold text-foreground">{n.title}</div>
            {n.message && <div className="text-sm text-muted-foreground">{n.message}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
