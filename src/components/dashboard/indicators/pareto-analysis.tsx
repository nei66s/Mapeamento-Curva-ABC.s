'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Incident } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ParetoChart } from './pareto-chart';
import { summarizePareto } from '@/ai/flows/summarize-pareto-flow';
import { Switch } from '@/components/ui/switch';

interface ParetoAnalysisProps {
  incidents: Incident[];
}

type ParetoData = {
  category: string;
  count: number;
}[];

export function ParetoAnalysis({ incidents }: ParetoAnalysisProps) {
  const [analysis, setAnalysis] = useState<ParetoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matrixItems, setMatrixItems] = useState<string[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [restrictByMatrix, setRestrictByMatrix] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAnalysis = useCallback(async (currentIncidents: Incident[]) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Use local aggregation only (AI disabled)
      if (currentIncidents.length > 0) {
        const local = aggregateIncidentsLocally(currentIncidents);
        setAnalysis(local);
        // Kick off AI analysis for the currently computed Pareto slice
        try {
          const cacheKey = `pareto-analysis:${(new Date()).toISOString().slice(0,7)}`;
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.summary && parsed.ts) {
              const age = Date.now() - parsed.ts;
              if (age < 1000 * 60 * 60 * 24) { // 24h
                setAiSummary(parsed.summary);
              } else {
                setAiSummary(null);
              }
            }
          }
          if (!aiSummary) {
            setAiLoading(true);
            const flowInput = { mes: null, slice: local.map(it => ({ category: it.category, count: it.count })) };
            const res = await summarizePareto(flowInput as any);
            setAiSummary(res.summary);
            try { sessionStorage.setItem(cacheKey, JSON.stringify({ summary: res.summary, ts: Date.now() })); } catch(e){}
          }
        } catch (e) {
          console.error('Pareto AI analysis failed', e);
        } finally {
          setAiLoading(false);
        }
      } else {
        setAnalysis([]);
      }
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao gerar a análise de Pareto.');
    } finally {
      setLoading(false);
    }
  }, []);

// Simple local aggregation heuristic: summarize incidents by title/item or fallback to description
function aggregateIncidentsLocally(incidents: Incident[]) {
  // Prefer counting by incident title (most precise for root-cause Pareto).
  // Fallback to itemName or description when title is missing.
  const counts: Record<string, number> = {};
  for (const inc of incidents) {
    const raw = (inc.title || inc.itemName || inc.description || 'Outros');
    const key = String(raw).trim() || 'Outros';
    counts[key] = (counts[key] || 0) + 1;
  }

  const arr = Object.entries(counts).map(([category, count]) => ({ category, count }));
  arr.sort((a, b) => b.count - a.count);
  // Limit to top 7 as default Pareto slice
  return arr.slice(0, 7);
}

  // Fetch matrix items once (client-side) so we can restrict Pareto to items present in the items matrix
  useEffect(() => {
    let mounted = true;
    setLoadingItems(true);
    fetch('/api/items')
      .then(res => res.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          // store lower-cased names for tolerant matching
          const names = data.map((it: any) => String(it.name || it.item_name || '').toLowerCase()).filter(Boolean);
          setMatrixItems(names);
        } else {
          setMatrixItems([]);
          setRestrictByMatrix(false);
        }
      })
      .catch((e) => {
        console.error('Failed to load matrix items for Pareto filter', e);
        setMatrixItems([]);
        setRestrictByMatrix(false);
      })
      .finally(() => {
        if (mounted) setLoadingItems(false);
      });
    return () => { mounted = false; };
  }, []);

  // Recompute analysis whenever incidents or matrix items change
  useEffect(() => {
    // If we still need to restrict data and matrix is loading, wait for it
    if (restrictByMatrix && matrixItems === null) return;

    const dataToAnalyze = restrictByMatrix
      ? (() => {
        const allowedSet = new Set(matrixItems ?? []);
        return incidents.filter((inc) => {
          const name = String(inc.itemName || inc.description || '').toLowerCase();
          if (!name) return false;
          if (allowedSet.has(name)) return true;
          for (const m of allowedSet) {
            if (!m) continue;
            if (name.includes(m) || m.includes(name)) return true;
          }
          return false;
        });
      })()
      : incidents;

    fetchAnalysis(dataToAnalyze);
  }, [incidents, matrixItems, fetchAnalysis, restrictByMatrix]);

  const analyzedCauseCount = analysis?.length ?? 0;
  const filterStatusLabel = restrictByMatrix ? 'Filtrando apenas itens da matriz' : 'Incluindo todos os incidentes';
  const matrixInfoLabel = loadingItems
    ? 'Carregando itens da matriz...'
    : matrixItems
      ? `${matrixItems.length} itens na matriz`
      : 'Matriz indisponível';

  const renderContent = () => {
    if (loading) {
      return <Skeleton className="h-80 w-full mt-4" />;
    }
    if (error) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Erro na Análise</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    if (analysis) {
       if (analysis.length === 0) {
         return <p className="text-sm text-muted-foreground mt-4 text-center py-10">Não há dados de incidentes suficientes no mês selecionado para gerar uma análise.</p>
       }

      return <ParetoChart data={analysis} />;
    }
     return (
        <div className="text-sm text-muted-foreground text-center py-10">
            Análise de Pareto não disponível.
        </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Análise de Pareto (Causa Raiz)
            </CardTitle>
            <CardDescription>
              Identifique as causas mais frequentes.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <Switch
              checked={restrictByMatrix}
              onCheckedChange={(checked) => setRestrictByMatrix(Boolean(checked))}
              disabled={loadingItems}
            />
            <span>Filtrar por itens da matriz</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{filterStatusLabel}</span>
          <span className="text-muted-foreground/40">•</span>
          <span>{matrixInfoLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span>{analyzedCauseCount} causas analisadas</span>
          <span>{analysis ? `Top ${analysis.length}` : 'Nenhum top ainda'}</span>
        </div>
        {renderContent()}
        {aiLoading && <div className="text-sm text-muted-foreground mt-2">Gerando análise da IA...</div>}
        {aiSummary && (
          <div className="mt-4 border bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
            {aiSummary}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
