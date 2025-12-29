
'use client';

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
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
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const summarizeCriticidade = (aging: MaintenanceIndicator['aging']) => {
    return {
      baixa: aging.inferior_30.baixa + aging.entre_30_60.baixa + aging.entre_60_90.baixa + aging.superior_90.baixa,
      media: aging.inferior_30.media + aging.entre_30_60.media + aging.entre_60_90.media + aging.superior_90.media,
      alta: aging.inferior_30.alta + aging.entre_30_60.alta + aging.entre_60_90.alta + aging.superior_90.alta,
      muito_alta: aging.inferior_30.muito_alta + aging.entre_30_60.muito_alta + aging.entre_60_90.muito_alta + aging.superior_90.muito_alta,
    } as MaintenanceIndicator['criticidade'];
  };

  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const res = await fetch('/api/indicators');
        const data = await res.json();
        setIndicators(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          if (last?.mes) setSelectedMonth(last.mes);
          if (typeof last?.meta_sla === 'number') setAnnualSlaGoal(last.meta_sla);
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
        id: monthString,
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

    // Persist to backend then update local state
    (async () => {
      try {
        const res = await fetch('/api/indicators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newIndicator),
        });
        const saved = await res.json();
        setIndicators(prev => [...prev, saved].sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime()));
        setIsAddMonthOpen(false);
        toast({
          title: 'Mês Adicionado!',
          description: `O mês ${new Date(monthString + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })} foi adicionado.`,
        });
      } catch (err) {
        console.error('Failed to save new month', err);
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar o mês no servidor.' });
      }
    })();
  };
  
  const scheduleSave = useCallback((updated: MaintenanceIndicator) => {
    const key = updated.mes;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await fetch('/api/indicators', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch (err) {
        console.error('autosave error', err);
      } finally {
        delete saveTimers.current[key];
      }
    }, 500);
  }, []);

  const handleAgingUpdate = (updatedAging: MaintenanceIndicator['aging']) => {
    setIndicators(prevIndicators => {
      const next = prevIndicators.map(indicator => 
        indicator.mes === selectedMonth 
        ? { ...indicator, aging: updatedAging, criticidade: summarizeCriticidade(updatedAging) } 
        : indicator
      );
      const updated = next.find(i => i.mes === selectedMonth);
      if (updated) scheduleSave(updated);
      return next;
    });
  };

  // Autosave updates from SLA and Calls tables
  const handleItemChange = (updated: MaintenanceIndicator) => {
    scheduleSave(updated);
  };

  // When meta anual muda, aplica a todos os meses e salva automaticamente (debounced por mês)
  useEffect(() => {
    setIndicators(prev => {
      const changed = prev.some(i => i.meta_sla !== annualSlaGoal);
      if (!changed) return prev;
      const next = prev.map(i => ({ ...i, meta_sla: annualSlaGoal }));
      next.forEach(ind => scheduleSave(ind));
      return next;
    });
  }, [annualSlaGoal, scheduleSave]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        moduleKey="releases"
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
                  onChangeItem={handleItemChange}
                />
                <EditableCallsTable 
                  data={indicators} 
                  setData={setIndicators} 
                  onChangeItem={handleItemChange}
                />
            </div>
            <div >
                <EditableAgingTableByCriticism 
                  indicator={selectedData} 
                  onUpdate={handleAgingUpdate} 
                />
            </div>
        </section>
      )}

    </div>
  );
}
