'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRealtimeMetrics, useTimeseries, useTopRoutes } from '@/hooks/use-metrics';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { useUsers } from '@/hooks/use-users';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { useMemo } from 'react';
import { ArrowUpRight, Activity, RefreshCw, ShieldAlert, Users, Signal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { dateLocale } from '@/lib/config';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger';
};

function StatCard({ label, value, hint, icon, tone = 'default' }: StatCardProps) {
  const toneClass =
    tone === 'danger'
      ? 'border-destructive/40 bg-destructive/5 text-destructive'
      : tone === 'warning'
        ? 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300'
        : 'text-foreground';
  return (
    <Card className={`h-full ${toneClass}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: undefined });
  } catch (e) {
    return date;
  }
}

export default function AdminDashboardPage() {
  const realtime = useRealtimeMetrics();
  const timeseries = useTimeseries();
  const topRoutes = useTopRoutes();
  const auditLogs = useAuditLogs({ pageSize: 8 });
  const users = useUsers({ pageSize: 5, status: 'active' });

  const deviceChartData = useMemo(
    () => (realtime.data?.deviceSplit || []).map((d) => ({ name: d.label, value: d.value })),
    [realtime.data]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        moduleKey="admin-dashboard"
        title="Painel de Governança"
        description="Indicadores em tempo quase real, acessos e ações sensíveis do aplicativo."
      >
        <Badge variant="outline" className="gap-1">
          <RefreshCw className="h-4 w-4" />
          {realtime.isFetching ? 'Atualizando...' : 'Online'}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Usuários ativos (5m)"
          value={realtime.data?.activeUsers5m ?? '—'}
          hint="Atualiza a cada 5 segundos via polling (troque para WebSocket se disponível)."
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Usuários ativos (1h)"
          value={realtime.data?.activeUsers1h ?? '—'}
          hint={`${realtime.data?.currentSessions ?? '—'} sessões simultâneas`}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Requisições/min"
          value={typeof realtime.data?.rpm === 'number' ? realtime.data.rpm.toFixed(1) : '—'}
          hint="Picos recentes em acessos por minuto."
          icon={<Signal className="h-4 w-4" />}
        />
        <StatCard
          label="Erros monitorados"
          value={realtime.data?.errorsPerMinute ?? 0}
          hint={`${realtime.data?.errorsLast24h ?? 0} ocorrências nas últimas 24h`}
          tone={(realtime.data?.errorsPerMinute ?? 0) > 0.5 ? 'danger' : 'default'}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Acessos por página</CardTitle>
                <CardDescription>Série temporal de pageviews.</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Tendência
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {timeseries.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeseries.data || []}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleTimeString(dateLocale)}
                    formatter={(value: number) => [`${value} acessos`, 'Pageviews']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top 5 páginas</CardTitle>
            <CardDescription>Rotas com maior volume recente.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {topRoutes.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(topRoutes.data || []).slice(0, 5)}>
                  <XAxis dataKey="route" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [`${value} acessos`, 'Rotas']} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Distribuição de dispositivos</CardTitle>
            <CardDescription>Origem dos acessos.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {realtime.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceChartData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Últimos logins</CardTitle>
            <CardDescription>Acompanhamento de acessos recentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-3">
                {(users.data?.items || []).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{user.lastAccessAt ? formatTimeAgo(user.lastAccessAt) : '—'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas ações administrativas</CardTitle>
          <CardDescription>Eventos de auditoria com payload registrado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                (auditLogs.data?.items || []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.userName || log.userId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString(dateLocale)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ip}
                      <Separator orientation="vertical" className="mx-2 inline h-4" />
                      {log.location || log.userAgent}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
