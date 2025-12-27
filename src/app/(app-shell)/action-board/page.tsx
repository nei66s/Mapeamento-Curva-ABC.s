"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import type { ActionBoardItem } from '@/lib/types';

const statusVariant = (status: string) => {
  const norm = status.toLowerCase();
  if (norm.includes('pendente')) return 'destructive';
  if (norm.includes('andamento')) return 'secondary';
  return 'outline';
};

const formatDate = (iso?: string | null) => {
  if (!iso) return 'Sem prazo';
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return 'Sem prazo';
  }
};

export default function ActionBoardPage() {
  const [items, setItems] = useState<ActionBoardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/action-board');
        if (!res.ok) throw new Error('Failed to load action board');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const metrics = useMemo(() => {
    const total = items.length;
    const done = items.filter(item => item.status?.toLowerCase().includes('concl')).length;
    const withOwner = items.filter(item => item.owner && item.owner.trim().length > 0).length;
    const onTime = items.filter(item => item.dueDate).length;
    const avgProgress = total ? Math.round(items.reduce((acc, item) => acc + (item.progress || 0), 0) / total) : 0;

    return [
      { label: 'Acoes concluídas', value: `${done}/${total}` },
      { label: 'Acoes com responsavel', value: `${withOwner}/${total}` },
      { label: 'Acoes com prazo definido', value: `${onTime}/${total}` },
      { label: 'Progresso medio', value: `${avgProgress}%` },
    ];
  }, [items]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Quadro de Acoes e Planos"
        description="Converte insights da Curva ABC e do monitoramento em tarefas rastreaveis e com donos definidos."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
              <CardDescription>{metric.label}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acoes em execucao</CardTitle>
          <CardDescription>Rastreie cada plano derivado da curva e de alertas criticos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="surface-glass p-4 text-sm text-muted-foreground">
              Carregando quadro de acoes...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="surface-glass p-4 text-sm text-muted-foreground">
              Nenhuma acao registrada. Crie novas entradas para acompanhar planos e responsaveis.
            </div>
          )}
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="surface-glass p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{item.owner}</span>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-lg font-semibold">{item.title}</p>
                {item.details && <p className="text-sm text-muted-foreground">{item.details}</p>}
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-muted-foreground">
                  <span>Vencimento {formatDate(item.dueDate)}</span>
                  <span>Progresso {item.progress}%</span>
                </div>
                <div className="mt-2">
                  <Progress value={item.progress} className="h-2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
