"use client";

import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export type AiStatusSummary = {
  available: boolean | null;
  envKey: boolean;
  credFile: boolean;
  checkedAt: number | null;
  loading: boolean;
  error?: string;
};

type Props = {
  status: AiStatusSummary;
  onRefresh: () => void;
};

export function AiStatusIndicator({ status, onRefresh }: Props) {
  const label = status.loading
    ? 'Verificando IA'
    : status.available
      ? 'IA disponível'
      : 'IA indisponível';

  const toneClass = status.loading
    ? 'bg-muted/40 text-muted-foreground'
    : status.available
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-rose-100 text-rose-800';

  const detailText = status.checkedAt
    ? `Última verificação às ${format(new Date(status.checkedAt), 'HH:mm:ss')}`
    : 'Sem verificação ainda';

  return (
    <div className="mt-3 flex flex-col gap-1 text-[0.75rem]">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${toneClass}`}>
          {label}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <RefreshCw className="h-3 w-3 rotate-0" />
          Recarregar
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-muted-foreground">
        <span>{detailText}</span>
        <span>• {status.envKey ? 'Chave de API configurada' : 'Sem chave de API'}</span>
        <span>• {status.credFile ? 'Credenciais locais carregadas' : 'Credenciais locais ausentes'}</span>
      </div>
      {status.error && (
        <div className="text-[0.65rem] text-destructive">
          Erro: {status.error?.slice(0, 80)}
        </div>
      )}
    </div>
  );
}
