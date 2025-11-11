"use client";

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/shared/page-header';
import type { ComplianceChecklistItem, StoreComplianceData, ComplianceStatus, Store } from '@/lib/types';
import { ComplianceChecklist } from '@/components/dashboard/compliance/compliance-checklist';
import { ComplianceSummary } from '@/components/dashboard/compliance/compliance-summary';
import { ManageChecklistItems } from '@/components/dashboard/compliance/manage-checklist-items';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getMonth, getYear, setMonth, setYear, isBefore, startOfDay, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScheduleVisitForm } from '@/components/dashboard/compliance/schedule-visit-form';
import { Skeleton } from '@/components/ui/skeleton';
import { HeroPanel } from '@/components/shared/hero-panel';
import { Badge } from '@/components/ui/badge';

export default function CompliancePageClient({ searchParams = {} }: { searchParams?: Record<string, any> } = {}) {
  const [checklistItems, setChecklistItems] = useState<ComplianceChecklistItem[]>([]);
  const [storeData, setStoreData] = useState<StoreComplianceData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [displayDate, setDisplayDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { toast } = useToast();

  const ComplianceMap = useMemo(() => dynamic(() => import('@/components/dashboard/compliance/compliance-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />,
  }), []);

  const { scheduledDates, completedDates, pendingDates, futureDates } = useMemo(() => {
    const statusByDate: Record<string, 'completed' | 'pending'> = {};
    
    storeData.forEach(d => {
      const dateStr = format(new Date(d.visitDate), 'yyyy-MM-dd');
      const hasPending = d.items.some(item => item.status === 'pending');
      
      if (!statusByDate[dateStr] || hasPending) {
        statusByDate[dateStr] = hasPending ? 'pending' : 'completed';
      }
    });

    const scheduled = new Set<Date>();
    const completed = new Set<Date>();
    const pending = new Set<Date>();
    const future = new Set<Date>();
    const today = startOfDay(new Date());

    for (const dateStr in statusByDate) {
      const date = new Date(dateStr + 'T00:00:00');
      scheduled.add(date);
      if (isBefore(date, today)) {
        if (statusByDate[dateStr] === 'completed') {
          completed.add(date);
        } else {
          pending.add(date);
        }
      } else {
         future.add(date);
      }
    }

    return { scheduledDates: Array.from(scheduled), completedDates: Array.from(completed), pendingDates: Array.from(pending), futureDates: Array.from(future) };
  }, [storeData]);

  // Normalize compliance status values coming from the server or from legacy data
  const normalizeComplianceStatus = (s: any) => {
    // Map many possible legacy/localized variants to the canonical union type
    if (!s && s !== '') return 'pending';
    const v = String(s).trim().toLowerCase();
    // completed variants: completed, complete, concluído, concluido, conclu, concl, done, feito, ok
    if (
      v === 'completed' ||
      v === 'complete' ||
      v.includes('concl') ||
      v === 'done' ||
      v === 'feito' ||
      v === 'ok' ||
      v.includes('comp')
    ) return 'completed';
    // not-applicable variants
    if (
      v === 'not-applicable' ||
      v.includes('nao aplic') ||
      v.includes('não aplic') ||
      v === 'n/a' ||
      v === 'na' ||
      v === 'nao' ||
      v === 'nao_aplicavel'
    ) return 'not-applicable';
    return 'pending';
  };

  const filteredStoreData = useMemo(() => {
    if (selectedDate) {
       return storeData.filter(d => format(new Date(d.visitDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));
    }
    // Filter by month if no specific date is selected
    return storeData.filter(d => 
        new Date(d.visitDate).getMonth() === displayDate.getMonth() &&
        new Date(d.visitDate).getFullYear() === displayDate.getFullYear()
    );
  }, [storeData, selectedDate, displayDate]);
  
  const handleStatusChange = (
    storeId: string,
    itemId: string,
    newStatus: ComplianceStatus
  ) => {
    // optimistic UI + persist
    setStoreData(prevData =>
      prevData.map(store => {
        if (store.storeId === storeId) {
          return {
            ...store,
            items: store.items.map(item =>
              String(item.itemId) === String(itemId) ? { ...item, status: newStatus } : item
            ),
          };
        }
        return store;
      })
    );

    // find the scheduled visit's date for this store so the server can locate the visit row
  const store = storeData.find(s => s.storeId === storeId);
    const visitDateStr = store && store.visitDate ? format(new Date(store.visitDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    (async () => {
      try {
        await fetch('/api/compliance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId, visitDate: visitDateStr, itemId, status: newStatus }),
        });
      } catch (err) {
        console.error('persist status change error', err);
      }
    })();
  };
  
  const handleAddItem = (it: { id?: string; name: string; classification?: string } | string) => {
    const payload = typeof it === 'string' ? { name: it, classification: 'C' } : { name: it.name, classification: it.classification ?? 'C' };
    // Persist to server and update local state. Fall back to local-only if API fails.
    (async () => {
      try {
        const res = await fetch('/api/compliance/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        let itemToAdd: ComplianceChecklistItem;
        if (res.ok) {
          itemToAdd = await res.json();
        } else {
          // fallback local
          itemToAdd = { id: `CHK-${Date.now()}`, name: payload.name, classification: payload.classification as any };
        }

        setChecklistItems(prev => [...prev, itemToAdd]);
        setStoreData(prevData =>
          prevData.map(store => ({
            ...store,
            items: [...store.items, { itemId: itemToAdd.id, status: 'pending' }],
          }))
        );
        toast({
          title: 'Item Adicionado!',
          description: `"${payload.name}" foi adicionado ao checklist.`,
        });
      } catch (err) {
        console.error('addItem API error', err);
  const itemToAdd: ComplianceChecklistItem = { id: `CHK-${Date.now()}`, name: payload.name, classification: payload.classification as any };
        setChecklistItems(prev => [...prev, itemToAdd]);
        setStoreData(prevData =>
          prevData.map(store => ({
            ...store,
            items: [...store.items, { itemId: itemToAdd.id, status: 'pending' }],
          }))
        );
        toast({
          title: 'Item Adicionado!',
          description: `"${payload.name}" foi adicionado ao checklist.`,
        });
      }
    })();
  };

  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = checklistItems.find(item => item.id === itemId);
    if (!itemToRemove) return;
    // Attempt server delete, fallback to local removal
    (async () => {
      try {
        const res = await fetch('/api/compliance/items', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId }),
        });
        if (res.ok) {
          setChecklistItems(prev => prev.filter(item => item.id !== itemId));
        } else {
          // fallback local
          setChecklistItems(prev => prev.filter(item => item.id !== itemId));
        }
      } catch (err) {
        console.error('deleteItem API error', err);
        setChecklistItems(prev => prev.filter(item => item.id !== itemId));
      }
    })();
    setStoreData(prevData =>
      prevData.map(store => ({
        ...store,
        items: store.items.filter(item => String(item.itemId) !== String(itemId)),
      }))
    );
    toast({
      variant: 'destructive',
      title: 'Item Removido!',
      description: `"${itemToRemove.name}" foi removido do checklist.`,
    });
  };

  const handleScheduleVisit = (storeName: string, visitDate: Date) => {
    const storeDetails = stores.find(s => s.name === storeName);
    
    const newVisit: StoreComplianceData = {
        storeId: storeDetails?.id || `LOJA-${Date.now()}`,
        storeName: storeName,
        visitDate: visitDate.toISOString(),
    items: checklistItems.map(item => ({ itemId: String(item.id), status: 'pending' })),
    };

    // persist to API
    (async () => {
      try {
        const res = await fetch('/api/compliance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVisit),
        });
        if (res.ok) {
          const created = await res.json();
          const normalized = { ...created, items: Array.isArray(created.items) ? created.items.map((it: any) => ({ itemId: String(it.itemId ?? it.id ?? it.item), status: normalizeComplianceStatus(it.status) })) : [] };
          setStoreData(prev => [...prev, normalized].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()));
          toast({ title: 'Visita agendada!', description: `Visita para a ${storeName} agendada em ${format(visitDate, 'dd/MM/yyyy')}.` });
        } else {
          // fallback to local
          setStoreData(prev => [...prev, newVisit].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()));
          toast({ title: 'Visita agendada (local)', description: `Visita para a ${storeName} adicionada localmente.` });
        }
      } catch (err) {
        console.error('schedule API error', err);
        setStoreData(prev => [...prev, newVisit].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()));
        toast({ title: 'Visita agendada (local)', description: `Visita para a ${storeName} adicionada localmente.` });
      } finally {
        setIsFormOpen(false);
      }
    })();
  };
  
  const handleDeleteVisit = (storeId: string) => {
    const deletedStore = storeData.find(d => d.storeId === storeId);
    if (!deletedStore) return;

    (async () => {
      try {
        const res = await fetch(`/api/compliance?storeId=${encodeURIComponent(storeId)}&visitDate=${encodeURIComponent(deletedStore.visitDate)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete on server');
        setStoreData(prevData => prevData.filter(d => d.storeId !== storeId));
        toast({ variant: 'destructive', title: 'Visita Removida!', description: `A visita para a loja "${deletedStore.storeName}" foi removida.` });
      } catch (err) {
        console.error('delete visit error', err);
        // fallback local delete
        setStoreData(prevData => prevData.filter(d => d.storeId !== storeId));
        toast({ variant: 'destructive', title: 'Visita Removida (local)', description: `Removida localmente: "${deletedStore.storeName}".` });
      }
    })();
  };


  const handleMonthChange = (month: number) => {
    setDisplayDate(prev => setMonth(prev, month));
  };

  const handleYearChange = (year: number) => {
    setDisplayDate(prev => setYear(prev, year));
  };
  
  const goToPreviousMonth = () => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), 'MMMM', { locale: ptBR }),
  }));

  useEffect(() => {
    if (!selectedDate) {
        setDisplayDate(new Date());
    }
  }, [selectedDate]);

  // Load stores for map and scheduling context
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/stores');
        if (!res.ok) throw new Error('Failed to load stores');
        const data: Store[] = await res.json();
        setStores(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Load compliance checklist items and scheduled visits from API
  useEffect(() => {
    const loadCompliance = async () => {
      try {
        const res = await fetch('/api/compliance');
        if (!res.ok) throw new Error('Failed to load compliance');
        const json = await res.json();
        setChecklistItems(Array.isArray(json.checklistItems) ? json.checklistItems : []);
        setStoreData(Array.isArray(json.storeData) ? json.storeData.map((s: any) => ({
          ...s,
          items: Array.isArray(s.items) ? s.items.map((it: any) => ({ itemId: String(it.itemId ?? it.id ?? it.item), status: normalizeComplianceStatus(it.status) })) : [],
        })) : []);
      } catch (err) {
        console.error('loadCompliance error', err);
      }
    };
    loadCompliance();
  }, []);

  const complianceMetrics = useMemo(() => {
    let total = 0;
    let completed = 0;
    let pending = 0;
    let notApplicable = 0;
    const today = Date.now();

    storeData.forEach(store => {
      store.items.forEach(item => {
        total += 1;
        if (item.status === 'completed') {
          completed += 1;
        } else if (item.status === 'pending') {
          pending += 1;
        } else if (item.status === 'not-applicable') {
          notApplicable += 1;
        }
      });
    });

    return {
      total,
      completed,
      pending,
      notApplicable,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      lastUpdated: storeData.length > 0 ? Math.max(...storeData.map(store => new Date(store.visitDate).getTime())) : today,
    };
  }, [storeData]);

  const upcomingVisits = useMemo(() => {
    const now = Date.now();
    return storeData
      .filter(d => new Date(d.visitDate).getTime() >= now)
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .slice(0, 3);
  }, [storeData]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cronograma de Preventivas"
        description="Acompanhe a conclusão dos itens de manutenção essenciais em todas as lojas."
      >
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <PlusCircle />
              Agendar Visita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agendar Nova Visita</DialogTitle>
            </DialogHeader>
            <ScheduleVisitForm 
                onSubmit={handleScheduleVisit}
                onCancel={() => setIsFormOpen(false)}
                defaultDate={selectedDate || new Date()}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <HeroPanel
          label="Compliance Hero"
          title="Preventivas em destaque"
          description={
            complianceMetrics.total > 0
              ? 'Monitoramento em tempo real do checklist em campo.'
              : 'Ainda não há visitas agendadas. Agende uma nova visita para começar o acompanhamento.'
          }
          stats={[
            {
              label: 'Itens concluídos',
              value: complianceMetrics.completed,
              helper: `${complianceMetrics.completionRate}% de conclusão`,
            },
            {
              label: 'Itens pendentes',
              value: complianceMetrics.pending,
              helper: `${complianceMetrics.notApplicable} não aplicáveis`,
            },
            {
              label: 'Visitas agendadas',
              value: storeData.length,
              helper: `Última atualização: ${formatDistanceToNow(new Date(complianceMetrics.lastUpdated), { addSuffix: true, locale: ptBR })}`,
            },
          ]}
        />
        <div className="rounded-3xl border border-border/40 bg-card/80 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Próximas inspeções</p>
            <Badge variant="secondary" className="text-[0.6rem] uppercase tracking-[0.2em]">
              {upcomingVisits.length} confirmadas
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingVisits.length > 0 ? (
              upcomingVisits.map((visit) => (
                <div key={`${visit.storeId}-${visit.visitDate}`} className="rounded-2xl border border-border bg-white/80 p-3 shadow-sm">
                  <p className="text-sm font-semibold">{visit.storeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(visit.visitDate), 'dd/MM/yyyy')} · {formatDistanceToNow(new Date(visit.visitDate), { addSuffix: true, locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {visit.items.filter(item => item.status === 'pending').length} itens pendentes
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma visita futura encontrada.</p>
            )}
          </div>
        </div>
      </section>

      <Card className="rounded-3xl border border-border/40 bg-card/80 shadow-lg">
        <CardContent className='p-4 sm:p-6'>
           <ComplianceMap 
         allStores={stores}
             scheduledVisits={filteredStoreData}
          />
        </CardContent>
      </Card>

      <section className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ComplianceSummary storeData={filteredStoreData} checklistItems={checklistItems} />
          </div>
          <div className="lg:col-span-2">
            <ManageChecklistItems
              items={checklistItems}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>

        <Card className="rounded-3xl border border-border/40 shadow-lg">
          <CardContent className="p-4 sm:p-6 grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
                 <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                        <ChevronLeft />
                    </Button>
                    <div className='flex items-center gap-2'>
                        <Select value={String(getMonth(displayDate))} onValueChange={(v) => handleMonthChange(Number(v))}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={String(getYear(displayDate))} onValueChange={(v) => handleYearChange(Number(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <Button variant="outline" size="icon" onClick={goToNextMonth}>
                        <ChevronRight />
                    </Button>
                </div>
                 <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={displayDate}
                    onMonthChange={setDisplayDate}
                    locale={ptBR}
                    className="rounded-md border"
                    modifiers={{ 
                      scheduled: scheduledDates,
                      completed: completedDates,
                      pending: pendingDates,
                      future: futureDates,
                    }}
                    modifiersClassNames={{
                      completed: 'bg-green-100 dark:bg-green-900',
                      pending: 'bg-orange-100 dark:bg-orange-900',
                      future: 'bg-blue-100 dark:bg-blue-900',
                    }}
                    modifiersStyles={{ 
                      scheduled: { color: 'hsl(var(--primary))', fontWeight: 'bold' }
                    }}
                 />
                 <Button className='w-full mt-4' variant="secondary" onClick={() => setSelectedDate(undefined)}>Limpar seleção</Button>
            </div>
           <div className="md:col-span-2">
                <ComplianceChecklist
                   checklistItems={checklistItems}
                   storeData={filteredStoreData}
                    onStatusChange={handleStatusChange}
                    onDeleteVisit={handleDeleteVisit}
                    currentDate={selectedDate || displayDate}
                   isDateView={!!selectedDate}
               />
           </div>
        </CardContent>
       </Card>
      </section>
    </div>
  );
}
