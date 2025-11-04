'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ComplianceChecklistItem, StoreComplianceData } from "@/lib/types";

interface ComplianceSummaryProps {
    storeData: StoreComplianceData[];
    checklistItems: ComplianceChecklistItem[];
}

export function ComplianceSummary({ storeData, checklistItems }: ComplianceSummaryProps) {

  const { totalCompleted, totalApplicable } = storeData.reduce(
    (acc, store) => {
      store.items.forEach(item => {
        if (item.status !== 'not-applicable') {
          acc.totalApplicable++;
          if (item.status === 'completed') {
            acc.totalCompleted++;
          }
        }
      });
      return acc;
    },
    { totalCompleted: 0, totalApplicable: 0 }
  );

  const completionPercentage = totalApplicable > 0
    ? Math.round((totalCompleted / totalApplicable) * 100)
    : 0;

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>Desempenho Geral de Conformidade</CardTitle>
        <CardDescription>
          Progresso de conclusão dos itens aplicáveis para o período selecionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progresso</span>
          <span className="text-lg font-bold text-primary">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalCompleted.toLocaleString()} itens concluídos</span>
            <span>de {totalApplicable.toLocaleString()} itens aplicáveis</span>
        </div>
      </CardContent>
    </Card>
  );
}
