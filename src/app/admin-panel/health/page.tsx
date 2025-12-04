"use client";

import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHealth } from '@/hooks/use-health';
import { Activity, AlertTriangle } from 'lucide-react';

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

export default function HealthPage() {
  const health = useHealth();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader moduleKey="admin-health" title="Healthcheck e Observabilidade" description="Status de dependências e últimos erros." />

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Uptime e versão do backend.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={health.data?.status === 'healthy' ? 'secondary' : 'destructive'}>
              {health.data?.status || '—'}
            </Badge>
            <Badge variant="outline">Versão {health.data?.version || '—'}</Badge>
            <Badge variant="outline">Uptime {health.data ? formatUptime(health.data.uptimeSeconds) : '—'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(health.data?.dependencies || []).map((dep) => (
            <div key={dep.name} className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{dep.name}</div>
                <Badge variant={dep.status === 'healthy' ? 'secondary' : 'destructive'}>{dep.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Última checagem: {dep.lastChecked ? new Date(dep.lastChecked).toLocaleString('pt-BR') : '—'} · Latência {dep.latencyMs ?? '—'}ms
              </div>
              {dep.details && <div className="text-xs text-amber-600 dark:text-amber-400">{dep.details}</div>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimos erros</CardTitle>
          <CardDescription>Lista de registros de erro retornados pelo endpoint de logs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(health.data?.lastErrors || []).map((err) => (
            <div key={err.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div className="font-semibold">{err.message}</div>
                </div>
                <Badge variant="outline">{err.service}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {err.timestamp ? new Date(err.timestamp).toLocaleString('pt-BR') : '—'} · status {err.statusCode ?? '—'}
              </div>
              {err.stack && (
                <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-muted/50 p-2 text-xs">{err.stack}</pre>
              )}
            </div>
          ))}
          {health.data?.lastErrors?.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" /> Nenhum erro recente.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
