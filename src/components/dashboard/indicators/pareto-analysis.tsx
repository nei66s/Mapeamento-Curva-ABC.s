'use client';
import { useState, useCallback, useEffect } from 'react';
import { analyzeIncidentsForPareto } from '@/ai/flows/pareto-analysis-flow';
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
      const incidentDescriptions = currentIncidents.map(inc => `${inc.itemName}: ${inc.description}`);
      if (incidentDescriptions.length > 0) {
        const response = await analyzeIncidentsForPareto({ incidents: incidentDescriptions });
        setAnalysis(response.analysis);
      } else {
        setAnalysis([]); // No incidents, so analysis is empty
      }
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao gerar a análise de Pareto.');
    } finally {
      setLoading(false);
    }
  }, []);

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
