'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ComplianceChecklistItem, StoreComplianceData } from "@/lib/types";

interface ComplianceSummaryProps {
    storeData: StoreComplianceData[];
    checklistItems: ComplianceChecklistItem[];
}

export function ComplianceSummary({ storeData, checklistItems }: ComplianceSummaryProps) {

  const normalizeStatus = (s: any) => {
    if (!s && s !== '') return 'pending';
    const v = String(s).trim().toLowerCase();
    if (v === 'completed' || v === 'concluído' || v === 'concluido' || v === 'done') return 'completed';
    if (v === 'not-applicable' || v === 'nao aplicavel' || v === 'não aplicável' || v === 'n/a') return 'not-applicable';
    return 'pending';
  };

  const { totalCompleted, totalApplicable } = storeData.reduce(
    (acc, store) => {
      (store.items || []).forEach(item => {
        const st = normalizeStatus(item.status);
        if (st !== 'not-applicable') {
          acc.totalApplicable++;
          if (st === 'completed') {
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
      {process.env.NODE_ENV !== 'production' && (
        <CardContent className="pt-0">
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Debug: detalhes por loja (apenas dev)</summary>
            <div className="mt-2 space-y-2">
              {storeData.map((store, sIdx) => (
                <div key={`store-${sIdx}-${String(store.storeId ?? store.storeName ?? 'unknown')}`}>
                  <div className="font-medium">{store.storeName || store.storeId}</div>
                  <ul className="list-disc list-inside">
                    {(store.items || []).map((it, itIdx) => (
                      <li key={`item-${sIdx}-${itIdx}-${String(it?.itemId ?? 'unknown')}`}>
                        {String(it?.itemId ?? `(idx:${itIdx})`)} — {String(it?.status)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </CardContent>
      )}
    </Card>
  );
}
