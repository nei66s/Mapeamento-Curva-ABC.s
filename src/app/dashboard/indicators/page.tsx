
"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import type { MaintenanceIndicator, Incident } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/indicators/kpi-card';
import { CallsChart } from '@/components/dashboard/indicators/calls-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
  }, []);
  // Defensive initialization: mockMaintenanceIndicators may be empty during migration.
  // Use the last available month if present, otherwise fall back to current year-month (YYYY-MM).
  // For development preview, default to August 2025 so Pareto shows populated data
  const lastIndicator = indicators && indicators.length > 0
    ? indicators[indicators.length - 1]
    : undefined;
  const initialMonth = indicators.length > 0 ? indicators[indicators.length - 1].mes : '2025-08';
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedData = useMemo(() => {
    return indicators.find(d => d.mes === selectedMonth) || indicators[0];
  }, [selectedMonth, indicators]);

  const allMonths = useMemo(() => {
    return indicators.map(d => ({
      value: d.mes,
      label: new Date(`${d.mes}-02`).toLocaleString('default', { month: 'long', year: 'numeric' })
    })).sort((a,b) => new Date(b.value).getTime() - new Date(a.value).getTime());
  }, [indicators]);

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
              <Button
                size="sm"
                className="ml-2"
                onClick={async () => {
                  setIsSyncing(true);
                  try {
                    const syncRes = await fetch('/api/sync-lancamentos', { method: 'POST', body: JSON.stringify({}) });
                    const syncJson = await syncRes.json();
                    if (!syncJson || !syncJson.ok) throw new Error(syncJson?.error || 'Sync failed');

                    const buildRes = await fetch('/api/build-indicators', { method: 'POST' });
                    const buildJson = await buildRes.json();
                    if (!buildJson || !buildJson.ok) throw new Error(buildJson?.error || 'Build failed');

                    // reload indicators
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
                }}
                disabled={isSyncing}
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>

              <Button
                size="sm"
                className="ml-2"
                onClick={async () => {
                  // Run targeted seed (demo) then sync+build
                  setIsSyncing(true);
                  try {
                    const seedRes = await fetch('/api/seed-targeted', {
                      method: 'POST',
                      body: JSON.stringify({ inferior: 50, entre: 50 }),
                    });
                    const seedJson = await seedRes.json();
                    if (!seedJson || !seedJson.ok) throw new Error(seedJson?.error || 'Seed failed');

                    // run sync + build
                    const syncRes = await fetch('/api/sync-lancamentos', { method: 'POST', body: JSON.stringify({}) });
                    const syncJson = await syncRes.json();
                    if (!syncJson || !syncJson.ok) throw new Error(syncJson?.error || 'Sync failed');

                    const buildRes = await fetch('/api/build-indicators', { method: 'POST' });
                    const buildJson = await buildRes.json();
                    if (!buildJson || !buildJson.ok) throw new Error(buildJson?.error || 'Build failed');

                    // reload indicators
                    const res = await fetch('/api/indicators');
                    const data = await res.json();
                    setIndicators(Array.isArray(data) ? data : []);

                    toast({ title: 'Seed demo executado', description: `Seed: inserted demo records; Sync: ${JSON.stringify(syncJson.result)} — Rebuild: ${JSON.stringify(buildJson.result)}` });
                  } catch (err: any) {
                    console.error(err);
                    toast({ title: 'Erro no seed demo', description: String(err?.message || err) });
                  } finally {
                    setIsSyncing(false);
                  }
                }}
              >
                Popular teste
              </Button>
            </div>
        </div>
      </PageHeader>
      
      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 flex items-center gap-3 mb-4">
            <BarChart3 />
            Indicadores Gerais
        </h2>
        <SummaryCards />
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
                <ClassificationTable />
            </div>
            <div className="lg:col-span-1">
                <ItemsByCurveChart />
            </div>
        </div>
      </section>

      <Separator />

      {selectedData && (
        <section>
       <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 flex items-center gap-3 mb-4">
        <LineChart />
        Indicadores Operacionais do Mês
      </h2>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
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
                    iconColor={selectedData.chamados_solucionados > selectedData.chamados_abertos ? 'text-green-500' : 'text-red-500'}
                />
              </div>
            </div>
            
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
                    <KpiAnalysis indicator={selectedData} />
                    <ParetoAnalysis incidents={incidentsForMonth} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
              <CallsChart data={indicators} />
              <SlaChart data={indicatorsWithGoal} />
            </div>

            <div className='mt-8'>
              <AgingChart data={selectedData.aging} />
            </div>
            
        </section>
      )}

    </div>
  );
}
