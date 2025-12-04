'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePageviews, useTopRoutes, useHeatmap, useTimeseries } from '@/hooks/use-metrics';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { dateLocale } from '@/lib/config';
import { useTracking } from '@/hooks/use-tracking';

type Filters = {
  route?: string;
  userId?: string;
  device?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<Filters>({ pageSize: 10, page: 1 });
  const pageviews = usePageviews(filters);
  const topRoutes = useTopRoutes(filters);
  const heatmap = useHeatmap(filters);
  const timeline = useTimeseries(filters);
  const { trackAction } = useTracking();

  const uniqueRoutes = useMemo(() => (topRoutes.data || []).map((r) => r.route), [topRoutes.data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Métricas e Acessos"
        moduleKey="admin-analytics"
        description="Eventos de pageview, top rotas e heatmap de horários."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Defina intervalos e rota para refinar.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select onValueChange={(route) => setFilters((prev) => ({ ...prev, route }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rota" />
              </SelectTrigger>
              <SelectContent>
                {uniqueRoutes.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="User ID"
              className="w-32"
              onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
            />
            <Input
              type="date"
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
            />
            <Input type="date" onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
            <Button
              variant="outline"
              onClick={() => {
                trackAction('analytics.filter', filters as any);
                pageviews.refetch();
              }}
            >
              Aplicar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Acessos por tempo</CardTitle>
              <CardDescription>Intervalos agregados (linha).</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline.data || []}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString(dateLocale)}
                    formatter={(value: number) => [`${value} pageviews`, 'Acessos']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Heatmap de horário</CardTitle>
              <CardDescription>Volume por hora do dia.</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmap.data || []}>
                  <XAxis dataKey="hour" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [`${value} hits`, 'Hora']} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos de pageview</CardTitle>
          <CardDescription>Paginado e filtrável por rota, data, usuário, device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Navegador</TableHead>
                  <TableHead>Horário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pageviews.data?.items || []).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.route}</TableCell>
                    <TableCell>{event.userId || 'anon'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.device}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{event.browser}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString(dateLocale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
