
'use client';

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
import { format, getMonth, getYear, setMonth, setYear, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScheduleVisitForm } from '@/components/dashboard/compliance/schedule-visit-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompliancePage() {
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
              item.itemId === itemId ? { ...item, status: newStatus } : item
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
  
  const handleAddItem = (itemName: string) => {
    const newItem: ComplianceChecklistItem = {
      id: `CHK-${Date.now()}`,
      name: itemName,
      classification: 'C' // Default to C
    };
    setChecklistItems(prev => [...prev, newItem]);
    setStoreData(prevData =>
      prevData.map(store => ({
        ...store,
        items: [...store.items, { itemId: newItem.id, status: 'pending' }],
      }))
    );
    toast({
      title: 'Item Adicionado!',
      description: `"${itemName}" foi adicionado ao checklist.`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = checklistItems.find(item => item.id === itemId);
    if (!itemToRemove) return;
    setChecklistItems(prev => prev.filter(item => item.id !== itemId));
    setStoreData(prevData =>
      prevData.map(store => ({
        ...store,
        items: store.items.filter(item => item.itemId !== itemId),
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
        items: checklistItems.map(item => ({ itemId: item.id, status: 'pending' })),
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
          setStoreData(prev => [...prev, created].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()));
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
        setStoreData(Array.isArray(json.storeData) ? json.storeData : []);
      } catch (err) {
        console.error('loadCompliance error', err);
      }
    };
    loadCompliance();
  }, []);

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

      <Card>
        <CardContent className='p-4 sm:p-6'>
           <ComplianceMap 
          allStores={stores}
              scheduledVisits={filteredStoreData}
           />
        </CardContent>
      </Card>

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
       <Card>
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
    </div>
  );
}

    
