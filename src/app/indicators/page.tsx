"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageHeader } from '@/components/shared/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { MaintenanceIndicator, Incident } from '@/lib/types';
// Operational month indicators removed (redundant with main panel)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
// dropdown removed from header per request
import { useToast } from '@/hooks/use-toast';
import { BarChart3, LineChart, BrainCircuit } from 'lucide-react';
import { CallsChart } from '@/components/dashboard/indicators/calls-chart';
import { SlaChart } from '@/components/dashboard/indicators/sla-chart';
import { KpiAnalysis } from '@/components/dashboard/indicators/kpi-analysis';
import { ParetoAnalysis } from '@/components/dashboard/indicators/pareto-analysis';
import { AgingChart } from '@/components/dashboard/indicators/aging-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { ClassificationTable } from '@/components/dashboard/classification-table';
// ItemsByCurveChart removed per request (chart DOM element hidden). Kept the component available if needed later.
import { Separator } from '@/components/ui/separator';
import type { Item } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { HeroPanel } from '@/components/shared/hero-panel';
import { AiStatusIndicator, type AiStatusSummary } from '@/components/dashboard/ai-status';
import { getSeasonSnapshot } from '@/lib/season';

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

  const { user, loading: userLoading } = useCurrentUser();

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
    // Do not start loading data until we know the current user state.
    if (userLoading) return;
    if (!user) return; // unauthenticated - RequirePermission/middleware will redirect
    load();
    return () => {
      mounted = false;
    };
  }, [refreshIndicators, refreshIncidents, toast, user, userLoading]);

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

  // Indicator for the calendar current month (YYYY-MM). Prefer this for KPI values
  const currentIndicator = useMemo(() => {
    return indicators.find(d => d.mes === currentYm) || undefined;
  }, [currentYm, indicators]);

  // incidents filtered for the calendar current month (used as fallback)
  const incidentsForCurrentMonth = useMemo(() => {
    const [year, month] = currentYm.split('-');
    return incidents.filter((incident) => {
      const incidentDate = new Date(incident.openedAt);
      return (
        incidentDate.getFullYear() === parseInt(year) &&
        incidentDate.getMonth() === parseInt(month) - 1
      );
    });
  }, [currentYm, incidents]);

  const openIncidentsCountCurrent = useMemo(() => {
    return incidentsForCurrentMonth.filter(i => i.status === 'Aberto' || i.status === 'Em Andamento').length;
  }, [incidentsForCurrentMonth]);

  const solvedIncidentsCountCurrent = useMemo(() => {
    return incidentsForCurrentMonth.filter(i => i.status === 'Resolvido' || i.status === 'Fechado').length;
  }, [incidentsForCurrentMonth]);

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
  const [aiStatus, setAiStatus] = useState<AiStatusSummary>({
    available: null,
    envKey: false,
    credFile: false,
    checkedAt: null,
    loading: true,
  });

  const refreshAiStatus = useCallback(async () => {
    setAiStatus(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const res = await fetch('/api/ai/status');
      if (!res.ok) {
        throw new Error(`AI status check failed (${res.status})`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Resposta inesperada: ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      setAiStatus({
        available: Boolean(data?.available),
        envKey: Boolean(data?.envKey),
        credFile: Boolean(data?.credFile),
        checkedAt: Date.now(),
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAiStatus(prev => ({
        available: false,
        envKey: prev.envKey,
        credFile: prev.credFile,
        checkedAt: Date.now(),
        loading: false,
        error: message,
      }));
    }
  }, []);

  const seasonSnapshot = useMemo(() => getSeasonSnapshot(), []);
  const { theme } = seasonSnapshot;

  useEffect(() => {
    refreshAiStatus();

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
  }, [refreshAiStatus]);

  const inventoryHeroStats = useMemo(() => {
    const total = inventoryItems.length;
    const aCount = inventoryItems.filter(i => i.classification === 'A').length;
    const bCount = inventoryItems.filter(i => i.classification === 'B').length;
    const cCount = inventoryItems.filter(i => i.classification === 'C').length;
    return [
      {
        label: 'Curva A',
        value: aCount,
        // use Curve A (red) palette
        containerClassName: 'curve-a border-transparent',
        colorClassName: 'text-current',
      },
      {
        label: 'Curva B',
        value: bCount,
        // use Curve B (yellow) palette
        containerClassName: 'curve-b border-transparent',
        colorClassName: 'text-current',
      },
      {
        label: 'Curva C',
        value: cCount,
        // use Curve C (green) palette
        containerClassName: 'curve-c border-transparent',
        colorClassName: 'text-current',
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
    // Order: Chamados Novos, Chamados Solucionados, Backlog, SLA Mensal
    const chamadosNovos = (currentIndicator && typeof currentIndicator.chamados_abertos === 'number')
      ? currentIndicator.chamados_abertos
      : (selectedData && typeof selectedData.chamados_abertos === 'number' ? selectedData.chamados_abertos : incidentsForCurrentMonth.length);

    const chamadosSolucionados = (currentIndicator && typeof currentIndicator.chamados_solucionados === 'number')
      ? currentIndicator.chamados_solucionados
      : (selectedData && typeof selectedData.chamados_solucionados === 'number' ? selectedData.chamados_solucionados : solvedIncidentsCountCurrent);

    const backlogValue = (currentIndicator && typeof currentIndicator.backlog === 'number')
      ? currentIndicator.backlog
      : (selectedData && typeof selectedData.backlog === 'number' ? selectedData.backlog : openIncidentsCountCurrent);

    return [
      {
        label: 'Chamados novos',
        value: chamadosNovos.toLocaleString ? chamadosNovos.toLocaleString('pt-BR') : chamadosNovos,
        helper: `Mês atual: ${currentYm}`,
      },
      {
        label: 'Chamados solucionados',
        value: typeof chamadosSolucionados === 'number' ? chamadosSolucionados.toLocaleString('pt-BR') : '—',
        helper: `Fonte: ${currentIndicator ? 'lancamentos' : (selectedData ? 'selecionado' : 'contagem')}`,
      },
      {
        label: 'Backlog',
        value: typeof backlogValue === 'number' ? backlogValue.toLocaleString('pt-BR') : '—',
        helper: 'Incidentes pendentes',
      },
      {
        label: 'SLA Mensal',
        value: selectedData ? `${selectedData.sla_mensal}%` : (currentIndicator ? `${currentIndicator.sla_mensal}%` : '—'),
        helper: selectedData ? `Meta ${selectedData.meta_sla ?? '—'}%` : 'Meta indisponível',
      },
    ];
  }, [openIncidentsCount, selectedData]);

  const quickHighlights = useMemo(() => [
    {
      label: 'Mês em análise',
      value: selectedMonthLabel,
    },
    {
      label: 'Itens classificados',
      value: inventoryItems.length.toLocaleString('pt-BR'),
    },
    {
      label: 'Chamados abertos',
      value: openIncidentsCountCurrent.toLocaleString('pt-BR'),
    },
  ], [selectedMonthLabel, inventoryItems.length, openIncidentsCountCurrent]);


  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-lg bg-card/90 p-8 shadow-sm border border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.2),_transparent_60%)] opacity-80" />
        <div className="relative z-10 grid gap-8">
          <PageHeader
            title={<span className="text-foreground">Painel de Indicadores</span>}
            description="Análise consolidada dos principais indicadores da manutenção."
            className="items-center gap-6"
          >
            <div className="flex items-center gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] border border-border bg-card">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {allMonths.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PageHeader>
          <div className="grid gap-4 md:grid-cols-3">
            {quickHighlights.map((highlight) => (
              <div
                key={highlight.label}
                className="rounded-2xl border border-border bg-muted/80 p-5 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{highlight.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {highlight.value}
                </p>
              </div>
            ))}
          </div>
          {/* Botões de sincronização/manuais removidos — dados vêm do banco de dados */}
          <p className="text-sm text-muted-foreground">
            Integre dados em lote, controle inventário e acompanhe SLA em um só lugar.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <HeroPanel
          label="Mês selecionado"
          title={selectedMonthLabel}
          description={
            selectedData
              ? 'Monitorando os KPIs e a qualidade do inventário ativo neste mês.'
              : 'Selecione um mês com dados ou sincronize para atualizar os indicadores.'
          }
          stats={heroStats}
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

      <section className="space-y-6 rounded-lg bg-card/80 p-6 shadow-sm border border-border/40">
        <div className="flex items-center gap-3 text-2xl font-semibold text-foreground">
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
            {/* Curve chart removed per design request */}
          </div>
        </div>
      </section>

      <Separator />

      {!selectedData && (
        <section>
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Sem dados para este mês</CardTitle>
              <CardDescription>
                Não foram encontrados indicadores para o mês selecionado ({selectedMonth}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Ação manual de sincronização removida — dados são provenientes do banco */}
            </CardContent>
          </Card>
        </section>
      )}

      {selectedData && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-2xl font-semibold text-foreground">
            <LineChart className="h-6 w-6 text-primary" />
            Indicadores Operacionais do Mês
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Causas recorrentes</CardTitle>
              <CardDescription>Itens mais citados nos incidentes deste mês.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topIncidentItems.length > 0 ? (
                (() => {
                  const maxCount = Math.max(...topIncidentItems.map(i => i.count), 1);
                  return topIncidentItems.map((entry, idx) => {
                    const relative = Math.round((entry.count / maxCount) * 100);
                    return (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div className="flex items-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold mr-3">{idx + 1}</div>
                          <div className="min-w-0">
                            <div className="flex items-center justify-between text-sm font-medium">
                              <span className="truncate">{entry.name}</span>
                              <span className="text-xs text-muted-foreground ml-3">{entry.count} ocorrências</span>
                            </div>
                            <div className="mt-1">
                              <Progress value={relative} className="h-2 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <p className="text-xs text-muted-foreground">Ainda não há incidentes suficientes para destacar causas.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-primary/40 bg-card elevation-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BrainCircuit className="h-6 w-6" />
                  Central de Análises com IA
                  <span className="ml-2">
                    {aiStatus.loading ? (
                      <span className="inline-flex items-center rounded-full bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">Verificando IA</span>
                    ) : aiStatus.available ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">IA disponível</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-800">IA indisponível</span>
                    )}
                  </span>
                </CardTitle>
            <CardDescription>
              Utilize inteligência artificial para obter insights sobre seus dados de manutenção.
            </CardDescription>
            <div
              className={`mt-3 rounded-2xl border border-dashed p-3 text-sm ${theme.backgroundClass} ${theme.borderClass}`}
            >
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">Estação atual</p>
              <p className={`text-base font-semibold ${theme.textClass}`}>{seasonSnapshot.seasonLabel}</p>
              <p className="text-xs text-muted-foreground">{seasonSnapshot.seasonNote}</p>
              {seasonSnapshot.activeEvent && (
                <div
                  className={`mt-3 rounded-xl border bg-white/80 p-3 text-[0.75rem] shadow-inner ${theme.borderClass}`}
                >
                  <p className="font-semibold text-[0.85rem] text-foreground">
                    {theme.eventEmoji ?? theme.emoji} {seasonSnapshot.activeEvent.name}
                  </p>
                  <p className="text-xs text-foreground">{seasonSnapshot.activeEvent.description}</p>
                  <p className="mt-1 text-[0.65rem] text-foreground">
                    {seasonSnapshot.activeEvent.impact}
                  </p>
                </div>
              )}
            </div>
            <AiStatusIndicator status={aiStatus} onRefresh={refreshAiStatus} />
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
