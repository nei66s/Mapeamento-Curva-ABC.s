
'use client';
import { useState, useEffect } from 'react';
import { suggestContingencyPlans } from '@/ai/flows/suggest-contingency-plans';
import { getIncidentSummary } from '@/ai/flows/incident-summary';
import type { Incident, Item } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, ListChecks, FileText, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface IncidentAnalysisProps {
  incident: Incident;
  items: Item[];
}

export function IncidentAnalysis({ incident, items }: IncidentAnalysisProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestedPlans, setSuggestedPlans] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const item = items.find(i => i.name === incident.itemName);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!item) {
        setError('Item relacionado ao incidente não encontrado.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const impact = 'Safety, Production';
        
        const [summaryResponse, plansResponse] = await Promise.all([
          getIncidentSummary({
            incidentDetails: incident.description,
            equipmentDetails: `${item.name} (${item.category})`,
            location: incident.location,
            impact: impact,
          }),
          suggestContingencyPlans({
            incidentDescription: incident.description,
            equipmentType: item.category,
            criticality: item.classification,
            impact: impact,
          }),
        ]);

        setSummary(summaryResponse.summary);
        setSuggestedPlans(plansResponse.suggestedPlans);
      } catch (e) {
        console.error(e);
        setError('Ocorreu um erro ao buscar a análise da IA.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [incident, item]);

  const renderSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-medium text-primary">{incident.itemName}</h3>
            <p className="text-sm text-muted-foreground">{incident.location}</p>
            <p className="mt-2 text-sm">{incident.description}</p>
        </div>
        <Separator />
      {loading && renderSkeleton()}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!loading && !error && (
        <div className="space-y-6">
          {summary && (
            <div>
              <h4 className="flex items-center gap-2 font-semibold mb-2">
                <FileText className="h-5 w-5 text-primary" />
                Resumo Executivo da IA
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border">{summary}</p>
            </div>
          )}

          {item?.contingencyPlan && (
             <div>
              <h4 className="flex items-center gap-2 font-semibold mb-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                Plano de Contingência Padrão
              </h4>
               <Alert variant="destructive">
                    <AlertDescription>{item.contingencyPlan}</AlertDescription>
                </Alert>
            </div>
          )}

          {suggestedPlans && (
            <div>
              <h4 className="flex items-center gap-2 font-semibold mb-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Sugestões Adicionais da IA
              </h4>
              <div className="space-y-2">
                {suggestedPlans.map((plan, index) => (
                  <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>{plan}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
