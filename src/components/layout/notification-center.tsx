"use client";

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';

const severityMap = {
  info: { icon: <Info className="h-5 w-5" />, tone: 'text-blue-500' },
  success: { icon: <CheckCircle2 className="h-5 w-5" />, tone: 'text-emerald-500' },
  warning: { icon: <AlertTriangle className="h-5 w-5" />, tone: 'text-amber-500' },
  error: { icon: <AlertCircle className="h-5 w-5" />, tone: 'text-destructive' },
} as const;

function formatTimeAgo(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (err) {
    return 'há pouco';
  }
}

export function NotificationCenter() {
  const { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead } = useNotifications();

  const total = useMemo(() => notifications.length, [notifications]);
  const empty = !loading && total === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button aria-label="Notificações" variant="ghost" size="icon">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-[0.65rem] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[22rem]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-none">Notificações</p>
          <div className="flex items-center gap-1 text-xs">
            <Button variant="ghost" size="sm" className="px-2 py-1" onClick={refresh}>
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" className="px-2 py-1" onClick={markAllAsRead}>
              Marcar todas
            </Button>
          </div>
        </div>
        <Separator className="my-2" />
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {loading && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                Carregando...
              </div>
            )}
            {empty && (
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Nenhuma notificação recente</span>
                <p className="text-xs text-muted-foreground/80">Fique tranquilo, está tudo em dia.</p>
              </div>
            )}
            {!empty &&
              !loading &&
              notifications.map(notification => {
                const { severity } = notification;
                const config = severityMap[severity] ?? severityMap.info;
                const isUnread = notification.readAt === null;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex flex-col gap-1 rounded-xl border bg-card/80 p-3 text-left shadow-sm transition-colors',
                      isUnread ? 'border-primary/70 bg-primary/5' : 'border-transparent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('h-6 w-6 rounded-full bg-muted/20 flex items-center justify-center')}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground/90">
                            {notification.message}
                          </p>
                        )}
                        {notification.module && (
                          <p className="text-[11px] uppercase tracking-wider text-primary-foreground/70">
                            {notification.module.replace(/-/g, ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatTimeAgo(notification.createdAt)}</span>
                      {isUnread && (
                        <button
                          type="button"
                          className="text-[11px] font-semibold uppercase tracking-wide text-primary hover:underline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
