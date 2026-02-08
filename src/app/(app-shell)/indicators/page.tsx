"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import type { MaintenanceIndicator, Incident } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/indicators/kpi-card';
import { CallsChart } from '@/components/dashboard/indicators/calls-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown, TrendingUp, BrainCircuit, BarChart3, LineChart, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SlaChart } from '@/components/dashboard/indicators/sla-chart';
import { KpiAnalysis } from '@/components/dashboard/indicators/kpi-analysis';
import { ParetoAnalysis } from '@/components/dashboard/indicators/pareto-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { ClassificationTable } from '@/components/dashboard/classification-table';
import { ItemsByCurveChart } from '@/components/dashboard/items-by-curve-chart';
import { Separator } from '@/components/ui/separator';
import { AgingChart } from '@/components/dashboard/indicators/aging-chart';

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<MaintenanceIndicator[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [iRes, incRes] = await Promise.all([
          fetch('/api/indicators'),
          fetch('/api/incidents'),
        ]);
        const [idata, incdata] = await Promise.all([iRes.json(), incRes.json()]);
        setIndicators(Array.isArray(idata) ? idata : []);
        setIncidents(Array.isArray(incdata) ? incdata : []);
      } catch (err) {
        console.error('Failed to load indicators/incidents', err);
        setIndicators([]);
        setIncidents([]);
        toast({ variant: 'destructive', title: 'Falha ao carregar dados', description: 'Não foi possível carregar indicadores e incidentes.' });
      }
    };
    load();
  }, [toast]);

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const initialMonth = currentYm;
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedData = useMemo(() => {
    return indicators.find(d => d.mes === selectedMonth) || undefined;
  }, [selectedMonth, indicators]);

  const allMonths = useMemo(() => {
    return indicators.map(d => ({
      value: d.mes,
      label: new Date(`${d.mes}-02`).toLocaleString('default', { month: 'long', year: 'numeric' })
    })).sort((a,b) => new Date(b.value).getTime() - new Date(a.value).getTime());
  }, [indicators]);

  const widgetDefaults = {
    summaryCards: true,
    classificationTable: true,
    itemsByCurve: true,
    kpiCards: true,
    kpiAnalysis: true,
    paretoAnalysis: true,
    callsChart: true,
    slaChart: true,
    agingChart: true,
  } as const;
  const [visible, setVisible] = useState<Record<string, boolean>>(() => ({ ...widgetDefaults }));

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch('/api/profile/dashboard-widgets');
        const j = await res.json();
        if (j?.ok && j.result) {
          setVisible(prev => ({ ...prev, ...j.result }));
        }
      } catch (e) {
        // ignore
      }
    };
    loadPrefs();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    const next = { ...visible, [key]: value };
    setVisible(next);
    try {
      await fetch('/api/profile/dashboard-widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch (err) {
      console.error('Failed to save dashboard widgets', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar preferências de exibição.' });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const syncRes = await fetch('/api/sync-lancamentos', { method: 'POST', body: JSON.stringify({}) });
      const syncJson = await syncRes.json();
      if (!syncJson || !syncJson.ok) throw new Error(syncJson?.error || 'Sync failed');

      const buildRes = await fetch('/api/build-indicators', { method: 'POST' });
      const buildJson = await buildRes.json();
      if (!buildJson || !buildJson.ok) throw new Error(buildJson?.error || 'Build failed');

      const res = await fetch('/api/indicators');
      const data = await res.json();
      setIndicators(Array.isArray(data) ? data : []);

      toast({ title: 'Sincronização concluída', description: `Sync: ${JSON.stringify(syncJson.result)} — rebuild: ${JSON.stringify(buildJson.result)}` });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro na sincronização', description: String(err?.message || err) });
    } finally {
      setIsSyncing(false);
    }
  };

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

  return (
    <div
      className="flex flex-col gap-8"
      style={{
        ['--primary' as any]: '31 100% 50%',
        ['--primary-foreground' as any]: '0 0% 100%',
        ['--accent' as any]: '31 100% 50%',
        ['--accent-foreground' as any]: '0 0% 100%',
      } as React.CSSProperties}
    >
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
                  <Button size="sm" className="ml-2">
                    <Settings className="mr-2" /> Layout
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Mostrar seções</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={visible.summaryCards} onCheckedChange={(v: any) => handleToggle('summaryCards', Boolean(v))}>
                    Resumo
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.classificationTable} onCheckedChange={(v: any) => handleToggle('classificationTable', Boolean(v))}>
                    Tabela de Classificação
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.itemsByCurve} onCheckedChange={(v: any) => handleToggle('itemsByCurve', Boolean(v))}>
                    Itens por Curva
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.kpiCards} onCheckedChange={(v: any) => handleToggle('kpiCards', Boolean(v))}>
                    KPIs principais
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.kpiAnalysis} onCheckedChange={(v: any) => handleToggle('kpiAnalysis', Boolean(v))}>
                    Análises
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.paretoAnalysis} onCheckedChange={(v: any) => handleToggle('paretoAnalysis', Boolean(v))}>
                    Pareto
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.callsChart} onCheckedChange={(v: any) => handleToggle('callsChart', Boolean(v))}>
                    Chamadas
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.slaChart} onCheckedChange={(v: any) => handleToggle('slaChart', Boolean(v))}>
                    SLA
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={visible.agingChart} onCheckedChange={(v: any) => handleToggle('agingChart', Boolean(v))}>
                    Envelhecimento
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>
      </PageHeader>
      
      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-3 mb-4">
            <BarChart3 />
            Indicadores Gerais
        </h2>
        {visible.summaryCards && <SummaryCards />}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {visible.classificationTable && (
              <div className="lg:col-span-2">
                  <ClassificationTable />
              </div>
            )}
            {visible.itemsByCurve && (
              <div className="lg:col-span-1">
                  <ItemsByCurveChart />
              </div>
            )}
        </div>
      </section>

      <Separator />

      {!selectedData && (
        <section>
          <Card className="border border-border rounded-2xl shadow-sm p-6 bg-card/80">
            <CardHeader>
              <CardTitle>Sem dados para este mês</CardTitle>
              <CardDescription>
                Não foram encontrados indicadores para o mês selecionado ({selectedMonth}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Tente selecionar outro mês ou construa indicadores manualmente.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {selectedData && (
        <section>
      <h2 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-3 mb-4">
        <LineChart />
        Indicadores Operacionais do Mês
      </h2>
            {visible.kpiCards && (
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      value={selectedData.backlog}
                      description="Incidentes pendentes"
                      icon={TrendingUp}
                  />
                  <KpiCard
                      title="Incidentes Solucionados"
                      value={selectedData.chamados_solucionados}
                      description={`${selectedData.chamados_abertos} abertos no mês`}
                    icon={selectedData.chamados_solucionados > selectedData.chamados_abertos ? ArrowUp : ArrowDown}
                    iconColor={selectedData.chamados_solucionados > selectedData.chamados_abertos ? 'text-accent' : 'text-destructive'}
                  />
                </div>
              </div>
            )}
            
            <Card className="border-primary border-2 mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <BrainCircuit className="h-6 w-6" />
                        Central de Análises com IA
                    </CardTitle>
                    <CardDescription>
                        Utilize inteligência artificial para obter insights sobre seus dados de manutenção.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {visible.kpiAnalysis && <KpiAnalysis indicator={selectedData} />}
                    {visible.paretoAnalysis && <ParetoAnalysis incidents={incidentsForMonth} />}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
              {visible.callsChart && <CallsChart data={indicators} />}
              {visible.slaChart && <SlaChart data={indicatorsWithGoal} />}
            </div>

            {visible.agingChart && (
              <div className='mt-8'>
                <AgingChart data={selectedData.aging} />
              </div>
            )}
            
        </section>
      )}

    </div>
  );
}
