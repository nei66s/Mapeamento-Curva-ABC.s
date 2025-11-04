
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import type { MaintenanceIndicator } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { EditableSlaTable } from '@/components/dashboard/indicators/editable-sla-table';
import { EditableCallsTable } from '@/components/dashboard/indicators/editable-calls-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddMonthForm } from '@/components/dashboard/indicators/add-month-form';
import { useToast } from '@/hooks/use-toast';
import { EditableAgingTableByCriticism } from '@/components/dashboard/indicators/editable-aging-table-by-criticism';


export default function ReleasesPage() {
  const [indicators, setIndicators] = useState<MaintenanceIndicator[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [annualSlaGoal, setAnnualSlaGoal] = useState<number>(80);
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const res = await fetch('/api/indicators');
        const data = await res.json();
        setIndicators(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          if (last?.mes) setSelectedMonth(last.mes);
        }
      } catch (e) {
        console.error('Failed to load indicators', e);
      }
    };
    loadIndicators();
  }, []);

  const selectedData = useMemo(() => {
    return indicators.find(d => d.mes === selectedMonth) || indicators[0];
  }, [selectedMonth, indicators]);

  const allMonths = useMemo(() => {
    return indicators.map(d => ({
      value: d.mes,
      label: new Date(`${d.mes}-02`).toLocaleString('default', { month: 'long', year: 'numeric' })
    })).sort((a,b) => new Date(b.value).getTime() - new Date(a.value).getTime());
  }, [indicators]);

  const handleAddNewMonth = (year: number, month: number) => {
    const monthString = `${year}-${String(month).padStart(2, '0')}`;
    if (indicators.some(ind => ind.mes === monthString)) {
        toast({
            variant: 'destructive',
            title: 'Mês já existe',
            description: 'Este mês já foi adicionado à lista de indicadores.',
        });
        return;
    }

    const newIndicator: MaintenanceIndicator = {
        id: String(indicators.length + 1),
        mes: monthString,
        sla_mensal: 0,
        meta_sla: annualSlaGoal,
        crescimento_mensal_sla: 0,
        r2_tendencia: 0,
        chamados_abertos: 0,
        chamados_solucionados: 0,
        backlog: indicators[indicators.length - 1]?.backlog || 0,
        aging: {
            inferior_30: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
            entre_30_60: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
            entre_60_90: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
            superior_90: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
        },
        criticidade: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
        prioridade: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
    };

    setIndicators(prev => [...prev, newIndicator].sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime()));
    setIsAddMonthOpen(false);
    toast({
        title: 'Mês Adicionado!',
        description: `O mês ${new Date(monthString + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })} foi adicionado.`,
    });
  };
  
  const handleAgingUpdate = (updatedAging: MaintenanceIndicator['aging']) => {
    setIndicators(prevIndicators => prevIndicators.map(indicator => 
        indicator.mes === selectedMonth 
        ? { ...indicator, aging: updatedAging } 
        : indicator
    ));
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Lançamentos Mensais"
        description="Gerencie os dados e metas dos indicadores de manutenção para cada mês."
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
             <Dialog open={isAddMonthOpen} onOpenChange={setIsAddMonthOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Mês
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Mês</DialogTitle>
                    </DialogHeader>
                    <AddMonthForm 
                        onSubmit={handleAddNewMonth}
                        onCancel={() => setIsAddMonthOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      
      {selectedData && (
        <section className='space-y-8'>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <EditableSlaTable 
                  data={indicators} 
                  setData={setIndicators} 
                  annualSlaGoal={annualSlaGoal}
                  setAnnualSlaGoal={setAnnualSlaGoal}
                />
                <EditableCallsTable data={indicators} setData={setIndicators} />
            </div>
            <div >
                <EditableAgingTableByCriticism indicator={selectedData} onUpdate={handleAgingUpdate} />
            </div>
        </section>
      )}

    </div>
  );
}
