
'use client';
import { useState, useCallback, useEffect } from 'react';
import { summarizeKpi } from '@/ai/flows/summarize-kpi-flow';
import type { MaintenanceIndicator } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface KpiAnalysisProps {
  indicator: MaintenanceIndicator;
}

export function KpiAnalysis({ indicator }: KpiAnalysisProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async (currentIndicator: MaintenanceIndicator) => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await summarizeKpi({
        mes: currentIndicator.mes,
        sla_mensal: currentIndicator.sla_mensal,
        meta_sla: currentIndicator.meta_sla,
        crescimento_mensal_sla: currentIndicator.crescimento_mensal_sla,
        chamados_abertos: currentIndicator.chamados_abertos,
        chamados_solucionados: currentIndicator.chamados_solucionados,
        backlog: currentIndicator.backlog,
      });
      setSummary(response.summary);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao buscar a análise da IA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (indicator) {
      fetchAnalysis(indicator);
    }
  }, [indicator, fetchAnalysis]);


  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[75%]" />
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    if (summary) {
      return (
        <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-4 border bg-muted/30 p-4 rounded-lg">
            {summary}
        </div>
      );
    }
    return (
        <div className="text-sm text-muted-foreground text-center py-10">
            Não há dados para gerar a análise.
        </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
          <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise de Desempenho
          </CardTitle>
          <CardDescription>
            Resumo executivo dos KPIs do mês.
          </CardDescription>
        </div>
      </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
    </Card>
  );
}
