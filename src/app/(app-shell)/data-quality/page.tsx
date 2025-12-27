import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { getDataQualitySnapshot } from '@/lib/observability.server';

const severityVariant = (severity: string) => {
  if (severity === 'critical') return 'destructive';
  if (severity === 'warning') return 'secondary';
  return 'outline';
};

export const metadata = {
  title: 'Observatorio da Qualidade dos Dados',
};

export const dynamic = 'force-dynamic';

export default async function DataQualityPage() {
  const snapshot = await getDataQualitySnapshot();

  return (
    <div className="page-stack">
      <PageHeader
        title="Observatorio da Qualidade dos Dados"
        description="Monitora consistencia, alertas e historico de cadastros que alimentam a Curva ABC."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {snapshot.metrics.map(metric => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
              <CardDescription>{metric.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-6">
              <div>
                <CardTitle>Alertas ativos</CardTitle>
                <CardDescription>Problemas que exigem investigacao humana</CardDescription>
              </div>
              <Badge variant="outline">{snapshot.alerts.length} ativos</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {snapshot.alerts.length === 0 && (
                <div className="surface-glass p-4 text-sm text-muted-foreground">
                  Nenhum alerta pendente no momento.
                </div>
              )}
              {snapshot.alerts.map(alert => (
                <div key={alert.id} className="surface-glass p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{alert.title}</p>
                    <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <CardDescription>Ultimos cadastros que alimentam os dashboards</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {snapshot.activity.length === 0 && (
                <li className="surface-glass p-4 text-sm text-muted-foreground">
                  Nenhuma atividade registrada recentemente.
                </li>
              )}
              {snapshot.activity.map(job => (
                <li key={`${job.title}-${job.when}`} className="surface-glass space-y-1 p-4">
                  <div className="flex items-center justify-between text-sm uppercase tracking-wide text-muted-foreground">
                    <span>{job.when}</span>
                    <Badge variant={job.status === 'ok' ? 'outline' : 'secondary'}>
                      {job.status === 'ok' ? 'Registrado' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="font-semibold text-lg">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.detail}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
