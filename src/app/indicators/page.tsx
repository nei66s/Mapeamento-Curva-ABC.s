"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { MaintenanceIndicator, Incident } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/indicators/kpi-card';
import { CallsChart } from '@/components/dashboard/indicators/calls-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown, TrendingUp, DollarSign, BrainCircuit, BarChart3, LineChart } from 'lucide-react';
import { SlaChart } from '@/components/dashboard/indicators/sla-chart';
import { KpiAnalysis } from '@/components/dashboard/indicators/kpi-analysis';
import { ParetoAnalysis } from '@/components/dashboard/indicators/pareto-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { ClassificationTable } from '@/components/dashboard/classification-table';
import { ItemsByCurveChart } from '@/components/dashboard/items-by-curve-chart';
import { Separator } from '@/components/ui/separator';
import { AgingChart } from '@/components/dashboard/indicators/aging-chart';
import type { Item } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { HeroPanel } from '@/components/shared/hero-panel';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${url} ${res.status} ${res.statusText} ${body}`);
  }
  return res.json();
}

const postJson = <T,>(url: string, body?: unknown): Promise<T> => {
  return fetchJson<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

type ActionResponse = {
  ok?: boolean;
  result?: unknown;
  error?: string;
};


export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<MaintenanceIndicator[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const { toast } = useToast();

  const refreshIndicators = useCallback(async () => {
    const data = await fetchJson<MaintenanceIndicator[]>('/api/indicators');
    setIndicators(Array.isArray(data) ? data : []);
    return data;
  }, []);

  const refreshIncidents = useCallback(async () => {
    const data = await fetchJson<Incident[]>('/api/incidents');
    setIncidents(Array.isArray(data) ? data : []);
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await Promise.all([refreshIndicators(), refreshIncidents()]);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load indicators/incidents', err);
        setIndicators([]);
        setIncidents([]);
        toast({
          variant: 'destructive',
          title: 'Falha ao carregar dados',
          description: 'Não foi possível carregar indicadores e incidentes.',
        });
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [refreshIndicators, refreshIncidents, toast]);

  // manual refetch for the alert action
  const refetchIncidents = useCallback(async () => {
    try {
      const incdata = await refreshIncidents();
      if (!Array.isArray(incdata) || incdata.length === 0) {
        toast({
          title: 'Nenhum incidente retornado',
          description: 'A API retornou zero incidentes. Verifique o servidor / banco.',
        });
      } else {
        toast({
          title: 'Incidentes recarregados',
          description: `Foram carregados ${incdata.length} incidentes.`,
        });
      }
    } catch (err) {
      console.error('Refetch incidents failed', err);
      toast({
        variant: 'destructive',
        title: 'Falha',
        description: 'Não foi possível recarregar incidentes.',
      });
    }
  }, [refreshIncidents, toast]);
  // Defensive initialization: use the last available month if present,
  // otherwise fall back to the current year-month (YYYY-MM).
  const lastIndicator = indicators && indicators.length > 0 ? indicators[indicators.length - 1] : undefined;
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // Always default to current year-month so selector shows current month even if empty
  const initialMonth = currentYm;
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [isSyncing, setIsSyncing] = useState(false);

  // Keep selectedMonth as the current month; if no data exists we'll show a 'no data' state.

  const selectedData = useMemo(() => {
    return indicators.find(d => d.mes === selectedMonth) || undefined;
  }, [selectedMonth, indicators]);

  // Helpers for sync/build actions used by the Sync menu
  const handleRunBoth = useCallback(async () => {
    setIsSyncing(true);
    try {
      const syncJson = await postJson<ActionResponse>('/api/sync-lancamentos', {});
      if (!syncJson?.ok) throw new Error(syncJson?.error || 'Sync failed');

      const buildJson = await postJson<ActionResponse>('/api/build-indicators');
      if (!buildJson?.ok) throw new Error(buildJson?.error || 'Build failed');

      await Promise.all([refreshIndicators(), refreshIncidents()]);

      toast({
        title: 'Sincronização concluída',
        description: `Sync: ${JSON.stringify(syncJson.result)} — Rebuild: ${JSON.stringify(buildJson.result)}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Erro na sincronização',
        description: String(err?.message || err),
      });
    } finally {
      setIsSyncing(false);
    }
  }, [refreshIndicators, refreshIncidents, toast]);

  const handleSyncOnly = useCallback(async () => {
    setIsSyncing(true);
    try {
      const syncJson = await postJson<ActionResponse>('/api/sync-lancamentos', {});
      if (!syncJson?.ok) throw new Error(syncJson?.error || 'Sync failed');

      await refreshIncidents();

      toast({
        title: 'Lançamentos atualizados',
        description: `Sync: ${JSON.stringify(syncJson.result)}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Erro no sync',
        description: String(err?.message || err),
      });
    } finally {
      setIsSyncing(false);
    }
  }, [refreshIncidents, toast]);

  const handleBuildOnly = useCallback(async () => {
    setIsSyncing(true);
    try {
      const buildJson = await postJson<ActionResponse>('/api/build-indicators');
      if (!buildJson?.ok) throw new Error(buildJson?.error || 'Build failed');

      await refreshIndicators();

      toast({
        title: 'Reconstrução concluída',
        description: `Rebuild: ${JSON.stringify(buildJson.result)}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Erro no rebuild',
        description: String(err?.message || err),
      });
    } finally {
      setIsSyncing(false);
    }
  }, [refreshIndicators, toast]);

  const handleSeedDemo = useCallback(async () => {
    setIsSyncing(true);
    try {
      const seedJson = await postJson<ActionResponse>('/api/seed-targeted', { inferior: 50, entre: 50 });
      if (!seedJson?.ok) throw new Error(seedJson?.error || 'Seed failed');

      const syncJson = await postJson<ActionResponse>('/api/sync-lancamentos', {});
      if (!syncJson?.ok) throw new Error(syncJson?.error || 'Sync failed');

      const buildJson = await postJson<ActionResponse>('/api/build-indicators');
      if (!buildJson?.ok) throw new Error(buildJson?.error || 'Build failed');

      await Promise.all([refreshIndicators(), refreshIncidents()]);

      toast({
        title: 'Seed demo executado',
        description: `Seed: dados de demonstração; Sync: ${JSON.stringify(syncJson.result)} — Rebuild: ${JSON.stringify(buildJson.result)}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Erro no seed demo',
        description: String(err?.message || err),
      });
    } finally {
      setIsSyncing(false);
    }
  }, [refreshIndicators, refreshIncidents, toast]);

  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchJson<Item[]>('/api/items', {
          signal: controller.signal,
        });
        if (!mounted) return;
        setInventoryItems(Array.isArray(data) ? data : []);
        setInventoryError(null);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load inventory items', err);
        setInventoryItems([]);
        setInventoryError(String(err));
      }
    };
    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const inventoryHeroStats = useMemo(() => {
    const total = inventoryItems.length;
    const aCount = inventoryItems.filter(i => i.classification === 'A').length;
    const others = total - aCount;
    const percentage = total > 0 ? Math.round((aCount / total) * 100) : 0;
    return [
      {
        label: 'Itens totais',
        value: total,
      },
      {
        label: 'Curva A',
        value: aCount,
        helper: `${percentage}%`,
      },
      {
        label: 'Outros itens',
        value: others,
      },
    ];
  }, [inventoryItems]);

  const inventoryDescription = inventoryError
    ? `Erro ao carregar inventário (${inventoryError}).`
    : 'Resumo atualizado da matriz de itens.';

  const allMonths = useMemo(() => {
    return indicators.map(d => ({
      value: d.mes,
      label: new Date(`${d.mes}-02`).toLocaleString('default', { month: 'long', year: 'numeric' })
    })).sort((a,b) => new Date(b.value).getTime() - new Date(a.value).getTime());
  }, [indicators]);

  const selectedMonthLabel = useMemo(() => {
    return (
      allMonths.find((month) => month.value === selectedMonth)?.label ??
      selectedMonth
    );
  }, [allMonths, selectedMonth]);

  const indicatorsWithGoal = useMemo(() => {
    return indicators.map(indicator => ({
      ...indicator,
      meta_sla: indicator.meta_sla,
    }));
  }, [indicators]);
  
  const incidentsForMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    return incidents.filter((incident) => {
      const incidentDate = new Date(incident.openedAt);
      return (
        incidentDate.getFullYear() === parseInt(year) &&
        incidentDate.getMonth() === parseInt(month) - 1
      );
    });
  }, [selectedMonth, incidents]);

  // Count open incidents for the selected month (use status values from types: 'Aberto' or 'Em Andamento')
  const openIncidentsCount = useMemo(() => {
    return incidentsForMonth.filter(i => i.status === 'Aberto' || i.status === 'Em Andamento').length;
  }, [incidentsForMonth]);

  const topIncidentItems = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const incident of incidentsForMonth) {
      const key = (incident.itemName || incident.title || incident.description || 'Outros').trim();
      if (!key) continue;
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [incidentsForMonth]);

  const totalTopIncidentCount = topIncidentItems.reduce((acc, entry) => acc + entry.count, 0);

  const heroStats = useMemo(() => {
    return [
      {
        label: 'SLA Mensal',
        value: selectedData ? `${selectedData.sla_mensal}%` : '—',
        helper: selectedData ? `Meta ${selectedData.meta_sla ?? '—'}%` : 'Meta indisponível',
      },
      {
        label: 'Backlog',
        value: openIncidentsCount.toLocaleString('pt-BR'),
        helper: 'Incidentes pendentes',
      },
      {
        label: 'Chamados solucionados',
        value: selectedData ? selectedData.chamados_solucionados.toLocaleString('pt-BR') : '—',
        helper: selectedData ? `${selectedData.chamados_abertos} abertos` : 'Sem dados abertos',
      },
    ];
  }, [openIncidentsCount, selectedData]);


  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Painel de Indicadores"
        description="Análise consolidada dos principais indicadores de desempenho da manutenção."
      >
        <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                    {allMonths.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                            {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
              <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="ml-2" disabled={isSyncing}>
                    {isSyncing ? 'Processando...' : 'Sincronizar ▾'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleRunBoth(); }}>
                    Executar ambos (sync + build)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSyncOnly(); }}>
                    Atualizar lançamentos (sync only)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleBuildOnly(); }}>
                    Recalcular indicadores (build only)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" className="ml-2" onClick={handleSeedDemo}>
                Popular teste
              </Button>
            </div>
        </div>
      </PageHeader>
      
      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <HeroPanel
          label="Mês selecionado"
          title={selectedMonthLabel}
          description={
            selectedData
              ? 'Monitorando os KPIs e a qualidade do inventário ativo neste mês.'
              : 'Selecione um mês com dados ou sincronize para atualizar os indicadores.'
          }
          stats={[
            ...heroStats,
            {
              label: 'Incidentes analisados',
              value: incidentsForMonth.length,
            },
          ]}
        />
        <HeroPanel
          label="Inventário em foco"
          title="Últimos dados da matriz de itens"
          description={inventoryDescription}
          stats={inventoryHeroStats}
        >
          <SummaryCards items={inventoryItems} hideOverallStats />
        </HeroPanel>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
          <BarChart3 className="h-6 w-6 text-primary" />
          Indicadores Gerais
        </div>
        {Array.isArray(incidents) && incidents.length === 0 && (
          <div className="mt-4">
            <Alert>
              <div className="flex items-center justify-between w-full">
                <div>
                  <AlertTitle>Nenhum incidente carregado</AlertTitle>
                  <AlertDescription>
                    Não foram encontrados incidentes. Isso pode indicar um problema na API ou no banco de dados.
                  </AlertDescription>
                </div>
                <div className="ml-4">
                  <Button size="sm" onClick={refetchIncidents}>Recarregar</Button>
                </div>
              </div>
            </Alert>
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ClassificationTable />
          </div>
          <div className="lg:col-span-1">
            <ItemsByCurveChart />
          </div>
        </div>
      </section>

      <Separator />

      {!selectedData && (
        <section>
          <Card className="border border-gray-200 rounded-3xl shadow-sm p-6 bg-card/80">
            <CardHeader>
              <CardTitle>Sem dados para este mês</CardTitle>
              <CardDescription>
                Não foram encontrados indicadores para o mês selecionado ({selectedMonth}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleRunBoth} disabled={isSyncing}>
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {selectedData && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
            <LineChart className="h-6 w-6 text-primary" />
            Indicadores Operacionais do Mês
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <KpiCard
              title="SLA Mensal"
              value={`${selectedData.sla_mensal}%`}
              change={selectedData.crescimento_mensal_sla}
              changeType={selectedData.crescimento_mensal_sla >= 0 ? 'increase' : 'decrease'}
              description={`Meta: ${selectedData.meta_sla}%`}
              icon={TrendingUp}
            />
            <KpiCard
              title="Backlog"
              value={openIncidentsCount}
              description="Incidentes pendentes"
              icon={TrendingUp}
            />
            <KpiCard
              title="Incidentes Solucionados"
              value={selectedData.chamados_solucionados}
              description={`${selectedData.chamados_abertos} abertos no mês`}
              icon={selectedData.chamados_solucionados > selectedData.chamados_abertos ? ArrowUp : ArrowDown}
              iconColor={selectedData.chamados_solucionados > selectedData.chamados_abertos ? 'text-green-500' : 'text-red-500'}
            />
          </div>

          <Card className="rounded-3xl border border-border/40 bg-white/80 shadow-lg">
            <CardHeader>
              <CardTitle>Causas recorrentes</CardTitle>
              <CardDescription>Itens mais citados nos incidentes deste mês.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topIncidentItems.length > 0 ? (
                topIncidentItems.map((entry) => {
                  const percentage = Math.min(100, (entry.count / (totalTopIncidentCount || 1)) * 100);
                  return (
                    <div key={entry.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="truncate">{entry.name}</span>
                        <span className="text-xs text-muted-foreground">{entry.count} ocorrências</span>
                      </div>
                      <Progress value={percentage} className="h-2 rounded-full" />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">Ainda não há incidentes suficientes para destacar causas.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-primary/40 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <BrainCircuit className="h-6 w-6" />
                Central de Análises com IA
              </CardTitle>
              <CardDescription>
                Utilize inteligência artificial para obter insights sobre seus dados de manutenção.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <KpiAnalysis indicator={selectedData} />
              <ParetoAnalysis incidents={incidentsForMonth} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <CallsChart data={indicators} />
            <SlaChart data={indicatorsWithGoal} />
          </div>

          <div className="mt-6">
            <AgingChart data={selectedData.aging} />
          </div>
        </section>
      )}

    </div>
  );
}
