 'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Incident } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ParetoChart } from './pareto-chart';

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

  const fetchAnalysis = useCallback(async (currentIncidents: Incident[]) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Use local aggregation only (AI disabled)
      if (currentIncidents.length > 0) {
        const local = aggregateIncidentsLocally(currentIncidents);
        setAnalysis(local);
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

// Simple local aggregation heuristic: map common item names into broader categories
function aggregateIncidentsLocally(incidents: Incident[]) {
    const mapping = (itemName: string) => {
    const name = (itemName || '').toLowerCase();
    if (name.includes('ar condicionado') || name.includes('ar-condicionado') || name.includes('split')) return 'Ar Condicionado';
    if (name.includes('compressor')) return 'Compressor';
    if (name.includes('painel') || name.includes('quadro')) return 'Painel / Quadro Elétrico';
    if (name.includes('motor') || name.includes('elevador')) return 'Motor / Mecânica';
    if (name.includes('válvula') || name.includes('valvula')) return 'Válvula';
    if (name.includes('máquina') || name.includes('maquina')) return 'Máquina';
    if (name.includes('bomba')) return 'Bomba';
    if (name.includes('sensor')) return 'Sensor';
    if (name.includes('esteira')) return 'Esteira / Transportador';
    return 'Outros';
  };

  const counts: Record<string, number> = {};
  for (const inc of incidents) {
    const cat = mapping(inc.itemName || inc.description || 'Outros');
    counts[cat] = (counts[cat] || 0) + 1;
  }

  const arr = Object.entries(counts).map(([category, count]) => ({ category, count }));
  arr.sort((a, b) => b.count - a.count);
  return arr;
}

  useEffect(() => {
    fetchAnalysis(incidents);
  }, [incidents, fetchAnalysis]);

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
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise de Pareto (Causa Raiz)
          </CardTitle>
          <CardDescription>
            Identifique as causas mais frequentes.
          </CardDescription>
        </div>
      </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
    </Card>
  );
}
