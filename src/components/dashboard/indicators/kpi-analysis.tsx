
'use client';
import { useState, useCallback, useEffect } from 'react';
import { summarizeKpi } from '@/ai/flows/summarize-kpi-flow';
import type { MaintenanceIndicator } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface KpiAnalysisProps {
  indicator: MaintenanceIndicator;
}

export function KpiAnalysis({ indicator }: KpiAnalysisProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalysis = useCallback(async (currentIndicator: MaintenanceIndicator) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    // Cache by month in sessionStorage so analysis is not re-generated while
    // the user remains on the page. Use key kpi-analysis:{mes} and a TTL.
    const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
    const cacheKey = `kpi-analysis:${currentIndicator.mes}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.summary && parsed.ts) {
          const age = Date.now() - parsed.ts;
          if (age < CACHE_TTL_MS) {
            setSummary(parsed.summary);
            return;
          }
        }
      }

      // Ensure we always call the AI using available data.
      // Coerce missing numeric fields to 0 so the server-side schema validation
      // receives numbers and the model can still generate a summary based
      // on partial information.
      const payload = {
        mes: currentIndicator.mes ?? indicator?.mes ?? '',
        sla_mensal: Number(currentIndicator.sla_mensal ?? 0),
        meta_sla: Number(currentIndicator.meta_sla ?? 0),
        crescimento_mensal_sla: Number(currentIndicator.crescimento_mensal_sla ?? 0),
        chamados_abertos: Number(currentIndicator.chamados_abertos ?? 0),
        chamados_solucionados: Number(currentIndicator.chamados_solucionados ?? 0),
        backlog: Number(currentIndicator.backlog ?? 0),
      };

      const response = await summarizeKpi(payload as any);
      setSummary(response.summary);
      // store in session cache
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ summary: response.summary, ts: Date.now() }));
      } catch (e) {
        // ignore storage errors
      }
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao buscar a análise da IA.');
    } finally {
      setLoading(false);
    }
  }, [indicator]);

  useEffect(() => {
    if (indicator) {
      // call analysis on mount or when the month changes; cached result
      // prevents repeated calls while staying on the page.
      fetchAnalysis(indicator);
    }
  }, [indicator, fetchAnalysis]);

  const handleCopySummary = async () => {
    if (!summary || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(summary);
      toast({ title: 'Resumo copiado', description: 'Análise da IA copiada para a área de transferência.' });
    } catch (err) {
      console.error('copy summary failed', err);
      toast({ variant: 'destructive', title: 'Não foi possível copiar', description: 'Tente novamente mais tarde.' });
    }
  };


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
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Análise de Desempenho
            </CardTitle>
            <CardDescription>
              Resumo executivo dos KPIs do mês.
            </CardDescription>
          </div>
          <div className="ml-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!indicator) return;
                // force refresh: clear cache and re-fetch
                try {
                  sessionStorage.removeItem(`kpi-analysis:${indicator.mes}`);
                } catch (e) {}
                await fetchAnalysis(indicator);
              }}
              disabled={loading}
            >
              {loading ? 'Gerando...' : 'Regenerar'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopySummary}
              disabled={loading || !summary}
            >
              Copiar resumo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
