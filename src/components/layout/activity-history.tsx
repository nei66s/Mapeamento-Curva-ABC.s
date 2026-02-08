"use client";

import { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUserHistory } from '@/hooks/use-history';

function formatEntryDate(value: string) {
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    return value;
  }
}

export function ActivityHistoryPanel() {
  const { history, loading, refresh } = useUserHistory();
  const [open, setOpen] = useState(false);
  const hasEntries = history.length > 0;
  const latestEntry = history[0];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      
      <SheetContent className="max-w-md">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold">Histórico de acesso</p>
            {latestEntry && (
              <p className="text-xs text-muted-foreground">
                Última atualização {formatEntryDate(latestEntry.createdAt)}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={refresh}>
            Recarregar
          </Button>
        </div>
        <Separator className="my-3" />
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {loading && (
              <p className="text-center text-sm text-muted-foreground">Carregando histórico...</p>
            )}
            {!loading && !hasEntries && (
              <p className="text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada ainda.
              </p>
            )}
            {!loading &&
              history.map(entry => (
                <div key={entry.id} className="rounded-2xl border bg-card p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {entry.module ?? entry.pathname}
                      </p>
                      {entry.action && (
                        <p className="text-xs text-muted-foreground/80">{entry.action}</p>
                      )}
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        {formatEntryDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                  {entry.details && (
                    <p className="mt-2 text-xs text-muted-foreground/90">
                      {typeof entry.details === 'string'
                        ? entry.details
                        : JSON.stringify(entry.details)}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
