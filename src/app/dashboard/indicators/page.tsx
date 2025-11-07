
'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { mockMaintenanceIndicators, mockIncidents } from '@/lib/mock-data';
import type { MaintenanceIndicator } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/indicators/kpi-card';
import { CallsChart } from '@/components/dashboard/indicators/calls-chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [indicators] = useState<MaintenanceIndicator[]>(mockMaintenanceIndicators);
  // Defensive initialization: mockMaintenanceIndicators may be empty during migration.
  // Use the last available month if present, otherwise fall back to current year-month (YYYY-MM).
  const lastIndicator = mockMaintenanceIndicators && mockMaintenanceIndicators.length > 0
    ? mockMaintenanceIndicators[mockMaintenanceIndicators.length - 1]
    : undefined;
  const initialMonth = lastIndicator?.mes ?? new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

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
    return mockIncidents.filter(incident => {
        const incidentDate = new Date(incident.openedAt);
        return incidentDate.getFullYear() === parseInt(year) && incidentDate.getMonth() === parseInt(month) - 1;
    });
  }, [selectedMonth]);


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
        </div>
      </PageHeader>
      
      <section>
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2 mb-4">
            <BarChart3 />
            Indicadores Gerais
        </h2>
        <SummaryCards />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
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
             <h2 className="text-2xl font-bold text-primary flex items-center gap-2 mb-4">
                <LineChart />
                Indicadores Operacionais do Mês
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
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
