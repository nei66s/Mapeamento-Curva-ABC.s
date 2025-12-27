import { listAiInsights } from '@/lib/ai-insights.server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import type { AiInsight } from '@/lib/types';

const statusVariant = (status: string) => {
  const norm = String(status || '').toLowerCase();
  if (norm.includes('pendente')) return 'destructive';
  if (norm.includes('revis')) return 'secondary';
  if (norm.includes('aprov')) return 'outline';
  return 'outline';
};

export const metadata = {
  title: 'Insights do Assistente AI',
};

export default async function AIInsightsPage() {
  let insights: AiInsight[] = [];
  try {
    insights = await listAiInsights();
  } catch (e) {
    insights = [];
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Insights do Assistente AI"
        description="Registra sugestoes do bot, status atual e proximos passos para garantir execucao e auditoria."
      />

      <Card>
        <CardHeader>
          <CardTitle>Ultimos insights</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 && (
            <div className="surface-glass p-4 text-sm text-muted-foreground">
              Nenhuma sugestao registrada ainda.
            </div>
          )}
          <div className="space-y-4">
            {insights.map((insight) => (
              <article key={insight.id} className="surface-glass p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{insight.title}</h2>
                  <Badge variant={statusVariant(insight.status)}>{insight.status}</Badge>
                </div>
                {insight.summary && <p className="mt-2 text-sm text-muted-foreground">{insight.summary}</p>}
                {insight.action && <p className="mt-2 text-sm text-muted-foreground">Proxima acao: {insight.action}</p>}
                {insight.source && <p className="mt-2 text-xs text-muted-foreground">Fonte: {insight.source}</p>}
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
 
