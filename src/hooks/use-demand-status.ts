"use client";

import { useCallback, useEffect, useState } from 'react';

export type DemandStatus = {
  loading: boolean;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentOpen: number;
  averageOpen: number;
  backlog: number;
  trend: 'rising' | 'steady' | 'falling';
  error?: string;
};

export function useDemandStatus() {
  const [status, setStatus] = useState<DemandStatus>({
    loading: true,
    severity: 'info',
    message: 'Carregando cenário de demanda...',
    currentOpen: 0,
    averageOpen: 0,
    backlog: 0,
    trend: 'steady',
  });

  const refresh = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const res = await fetch('/api/demand');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erro ${res.status}`);
      }
      const data = await res.json();
      setStatus({
        loading: false,
        severity: data.severity ?? 'info',
        message: data.message ?? 'Demanda atualizada',
        currentOpen: Number(data.currentOpen ?? 0),
        averageOpen: Number(data.averageOpen ?? 0),
        backlog: Number(data.backlog ?? 0),
        trend: data.trend ?? 'steady',
      });
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Falha ao carregar demanda',
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, refresh };
}
