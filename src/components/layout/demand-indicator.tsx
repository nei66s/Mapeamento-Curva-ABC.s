"use client";

import { ArrowDown, ArrowUp, Repeat } from 'lucide-react';
import { useDemandStatus } from '@/hooks/use-demand-status';

const severityClasses: Record<'info' | 'warning' | 'critical', string> = {
  info: 'bg-muted/40 text-muted-foreground',
  warning: 'bg-amber-100 text-amber-900',
  critical: 'bg-rose-100 text-rose-800',
};

const trendLabels: Record<'rising' | 'steady' | 'falling', { icon: JSX.Element; text: string }> = {
  rising: { icon: <ArrowUp className="h-3 w-3 text-rose-600" />, text: 'Demanda em alta' },
  falling: { icon: <ArrowDown className="h-3 w-3 text-emerald-600" />, text: 'Demanda em queda' },
  steady: { icon: <Repeat className="h-3 w-3 text-muted-foreground" />, text: 'Demanda estável' },
};

export function DemandIndicator() {
  const { status, refresh } = useDemandStatus();
  const trend = trendLabels[status.trend];

  return (
    <div className="hidden items-center gap-2 rounded-full border border-input/60 bg-background/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm md:flex">
      <div className="flex items-center gap-1 text-[0.65rem]">
        {trend.icon}
        <span>{trend.text}</span>
      </div>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${severityClasses[status.severity]}`}>
        {status.loading ? 'Atualizando' : status.severity === 'critical' ? 'Alerta crítico' : status.severity === 'warning' ? 'Atenção alta' : 'Operação normal'}
      </span>
      <button
        type="button"
        onClick={refresh}
        className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Atualizar
      </button>
      <div className="text-[0.65rem] text-muted-foreground">
        {status.currentOpen > 0 && `Chamados abertos: ${status.currentOpen}`}
      </div>
    </div>
  );
}
