"use client";

import { Badge } from '@/components/ui/badge';
import { useDemandStatus } from '@/hooks/use-demand-status';

const severityText: Record<'info' | 'warning' | 'critical', string> = {
  info: 'Operação normal',
  warning: 'Demanda em alta',
  critical: 'Alerta crítico',
};

export function SidebarDemandCard() {
  const { status, refresh } = useDemandStatus();
  return (
    <div className="rounded-3xl border border-surface-border bg-surface-background px-4 py-3 text-sm shadow-sm">
      <div className="mb-1 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
        <span>Demanda</span>
        <button
          type="button"
          onClick={refresh}
          className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary transition hover:text-primary/90"
        >
          Atualizar
        </button>
      </div>
      <div className="flex items-center gap-2 text-base font-semibold">
        <Badge variant={status.severity === 'critical' ? 'destructive' : status.severity === 'warning' ? 'outline' : 'secondary'}>
          {status.severity === 'critical' ? 'Crítico' : status.severity === 'warning' ? 'Atenção' : 'Estável'}
        </Badge>
        <span className="text-surface-foreground">{severityText[status.severity]}</span>
      </div>
      <p className="mt-1 text-[0.75rem] text-muted-foreground">
        Chamados abertos: <strong>{status.currentOpen}</strong> · Média: {status.averageOpen}
      </p>
      <p className="text-[0.7rem] text-muted-foreground">{status.message}</p>
    </div>
  );
}
