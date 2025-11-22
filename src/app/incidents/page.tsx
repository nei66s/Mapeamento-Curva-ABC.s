"use client";

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/shared/page-header';
import { HeroPanel } from '@/components/shared/hero-panel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { IncidentForm } from '@/components/dashboard/incidents/incident-form';
import { IncidentBulkForm } from '@/components/dashboard/incidents/incident-bulk-form';
import type { Item, Incident, Classification, IncidentStatus, Store } from '@/lib/types';
import { PlusCircle, Clock, Sparkles, Search, ListFilter, MoreVertical, Pencil, Tag, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IncidentAnalysis } from '@/components/dashboard/incidents/incident-analysis';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const statusVariantMap: Record<Incident['status'], 'destructive' | 'accent' | 'success' | 'default'> = {
  Aberto: 'destructive',
  'Em Andamento': 'accent',
  Resolvido: 'success',
  Fechado: 'default',
};

const allStatuses: IncidentStatus[] = ['Aberto', 'Em Andamento', 'Resolvido', 'Fechado'];
const allClassifications: Classification[] = ['A', 'B', 'C'];


export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const { toast } = useToast();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  useEffect(() => {
    if (!isFormOpen) {
      setSelectedIncident(null);
    }
  }, [isFormOpen]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<IncidentStatus>>(new Set());
  const [classificationFilters, setClassificationFilters] = useState<Set<Classification>>(new Set());

  const itemsMap = useMemo(() => new Map(items.map(item => [item.name, item])), [items]);

  const incidentSummary = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;
    let closedCount = 0;
    let openDaysTotal = 0;
    const now = Date.now();

    for (const incident of incidents) {
      const openedAt = new Date(incident.openedAt).getTime();
      const daysOpen = Math.max(0, now - openedAt) / (1000 * 60 * 60 * 24);
      if (incident.status === 'Aberto') {
        openCount += 1;
        openDaysTotal += daysOpen;
      }
      if (incident.status === 'Em Andamento') {
        inProgressCount += 1;
        openDaysTotal += daysOpen;
      }
      if (incident.status === 'Resolvido') {
        resolvedCount += 1;
      }
      if (incident.status === 'Fechado') {
        closedCount += 1;
      }
    }

    const openOrProgress = openCount + inProgressCount;

    return {
      total: incidents.length,
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      closed: closedCount,
      avgOpenDays: openOrProgress > 0 ? openDaysTotal / openOrProgress : 0,
    };
  }, [incidents]);

  const statusSummary = useMemo(() => {
    const counters: Record<IncidentStatus, number> = {
      Aberto: 0,
      'Em Andamento': 0,
      Resolvido: 0,
      Fechado: 0,
    };
    for (const incident of incidents) {
      counters[incident.status] = (counters[incident.status] || 0) + 1;
    }
    return allStatuses.map(status => ({
      status,
      count: counters[status],
    }));
  }, [incidents]);

  const classificationSummary = useMemo(() => {
    const counters: Record<Classification, number> = { A: 0, B: 0, C: 0 };
    for (const item of items) {
      if (counters[item.classification as Classification] !== undefined) {
        counters[item.classification as Classification] += 1;
      }
    }
    return counters;
  }, [items]);

  const heroStats = useMemo(() => [
    {
      label: 'Incidentes ativos',
      value: incidentSummary.open + incidentSummary.inProgress,
      helper: 'Aberto + Em andamento',
    },
    {
      label: 'Total registrado',
      value: incidentSummary.total,
      helper: 'Registros no sistema',
    },
    {
      label: 'Tempo médio aberto',
      value: `${incidentSummary.avgOpenDays.toFixed(1)} dias`,
      helper: 'Somente incidentes abertos',
    },
  ], [incidentSummary]);

  useEffect(() => {
    const load = async () => {
      // Fetch each resource individually to get clearer errors and graceful fallbacks
      // Items
      try {
        const res = await fetch('/api/items');
        if (!res.ok) {
          const body = await res.text().catch(() => 'no-body');
          console.error('Failed to load /api/items', res.status, body);
          toast({ variant: 'destructive', title: 'Falha ao carregar itens', description: `items endpoint status ${res.status}` });
          setItems([]);
        } else {
          const itemsJson = await res.json();
          setItems(itemsJson);
        }
      } catch (err) {
        console.error('Network error fetching /api/items', err);
        toast({ variant: 'destructive', title: 'Erro de rede', description: 'Não foi possível conectar ao endpoint de itens.' });
        setItems([]);
      }

      // Incidents
      try {
        const res = await fetch('/api/incidents');
        if (!res.ok) {
          const body = await res.text().catch(() => 'no-body');
          console.error('Failed to load /api/incidents', res.status, body);
          toast({ variant: 'destructive', title: 'Falha ao carregar incidentes', description: `incidents endpoint status ${res.status}` });
          setIncidents([]);
        } else {
          const incidentsJson = await res.json();
          setIncidents(incidentsJson);
        }
      } catch (err) {
        console.error('Network error fetching /api/incidents', err);
        toast({ variant: 'destructive', title: 'Erro de rede', description: 'Não foi possível conectar ao endpoint de incidentes.' });
        setIncidents([]);
      }

      // Stores
      try {
        const res = await fetch('/api/stores');
        if (!res.ok) {
          const body = await res.text().catch(() => 'no-body');
          console.error('Failed to load /api/stores', res.status, body);
          toast({ variant: 'destructive', title: 'Falha ao carregar lojas', description: `stores endpoint status ${res.status}` });
          setStores([]);
        } else {
          const storesJson = await res.json();
          setStores(storesJson);
        }
      } catch (err) {
        console.error('Network error fetching /api/stores', err);
        toast({ variant: 'destructive', title: 'Erro de rede', description: 'Não foi possível conectar ao endpoint de lojas.' });
        setStores([]);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const IncidentMap = useMemo(() => dynamic(() => import('@/components/dashboard/incidents/incident-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />,
  }), []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const item = itemsMap.get(incident.itemName);
      
      const searchMatch = searchTerm === '' ||
        incident.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilters.size === 0 || statusFilters.has(incident.status);
      
      const classificationMatch = classificationFilters.size === 0 || (item && classificationFilters.has(item.classification));

      return searchMatch && statusMatch && classificationMatch;
    }).sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [incidents, searchTerm, statusFilters, classificationFilters, itemsMap]);

  const handleFormSubmit = async (values: Omit<Incident, 'id' | 'openedAt' | 'status'|'lat'|'lng'>) => {
    const store = stores.find(s => s.name === values.location);
    try {
      if (selectedIncident) {
        const body = {
          id: selectedIncident.id,
          ...values,
          storeId: store?.id || selectedIncident.storeId || null,
          lat: store?.lat || selectedIncident.lat || 0,
          lng: store?.lng || selectedIncident.lng || 0,
        } as any;
        const res = await fetch('/api/incidents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('update failed');
        const updated: Incident = await res.json();
        setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));
        setSelectedIncident(updated);
        toast({ title: 'Incidente Atualizado!', description: `O incidente para o item "${values.itemName}" foi atualizado.` });
      } else {
  const body = { ...values, storeId: store?.id ?? null, lat: store?.lat || 0, lng: store?.lng || 0 } as any;
        const res = await fetch('/api/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('create failed');
        const created: Incident = await res.json();
        setIncidents(prev => [created, ...prev]);
        setSelectedIncident(created);
        toast({ title: 'Incidente Registrado!', description: `O incidente para o item "${values.itemName}" foi aberto.` });
      }
    } catch (err) {
      console.error('incident save error', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o incidente.' });
    }
  };

  const handleBulkSubmit = async (newIncidents: Omit<Incident, 'id' | 'openedAt' | 'status'>[]) => {
    const created: Incident[] = [];
    for (const inc of newIncidents) {
      try {
        const store = stores.find(s => s.name === inc.location);
        const body = { ...inc, storeId: store?.id ?? null, lat: store?.lat || 0, lng: store?.lng || 0 } as any;
        const res = await fetch('/api/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) created.push(await res.json());
      } catch (e) {
        console.error('bulk create incident failed', e);
      }
    }
    setIncidents(prev => [...created, ...prev]);
    toast({ title: 'Incidentes Registrados!', description: `${created.length} novos incidentes foram adicionados.` });
    setIsBulkFormOpen(false);
  }


  const openEditDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsFormOpen(true);
  };

  const openNewBulkDialog = () => {
    setSelectedIncident(null);
    setIsBulkFormOpen(true);
  }

  const handleAnalysisClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsAnalysisOpen(true);
  }
  
  const handleChangeStatus = async (incidentId: string, newStatus: IncidentStatus) => {
    setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: newStatus } : inc));
    try {
      await fetch('/api/incidents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: incidentId, status: newStatus }) });
    } catch (e) {
      console.error('persist status failed', e);
    }
    toast({ title: 'Status Atualizado!', description: `O status do incidente foi alterado para "${newStatus}".` });
  };

  const handleDeleteIncident = async (incidentId: string) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Tem certeza que deseja eliminar este incidente? Esta ação não pode ser desfeita.') : true;
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/incidents?id=${encodeURIComponent(incidentId)}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('delete failed', res.status, body);
        toast({ variant: 'destructive', title: 'Erro', description: body?.error || 'Não foi possível eliminar o incidente.' });
        return;
      }
      setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
      toast({ title: 'Incidente Eliminado', description: 'O incidente foi removido com sucesso.' });
    } catch (err) {
      console.error('delete error', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível eliminar o incidente.' });
    }
  };

  const toggleFilter = <T,>(set: Set<T>, value: T) => {
    const newSet = new Set(set);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    return newSet;
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Registro de Incidentes"
        description="Registre e acompanhe eventos específicos para análise futura."
      >
        <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewBulkDialog} className="flex gap-2">
              <PlusCircle />
              Registrar Incidentes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Registrar Novos Incidentes em Massa</DialogTitle>
            </DialogHeader>
            <IncidentBulkForm
              items={items}
              onSubmit={handleBulkSubmit}
              onCancel={() => setIsBulkFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      
      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <HeroPanel
          label="Panorama do momento"
          title="Incidentes em acompanhamento"
          description="Centralize os mais recentes eventos e monitore o tempo médio de atuação da equipe."
          stats={heroStats.map((stat) => ({
            label: stat.label,
            value: typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value,
            helper: stat.helper,
          }))}
        />
        <Card className="">
          <CardHeader>
            <CardTitle>Curva ABC em foco</CardTitle>
            <CardDescription>Distribuição dos itens cadastrados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['A', 'B', 'C'] as Classification[]).map(curve => {
              const count = classificationSummary[curve];
              const total = classificationSummary.A + classificationSummary.B + classificationSummary.C;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={curve} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>Curva {curve}</span>
                    <span>{count} itens ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2 rounded-full" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
          <Card className="">
            <CardHeader>
              <CardTitle>Mapa de Lojas e Incidentes</CardTitle>
              <CardDescription>Visualização geográfica de todas as lojas e incidentes ativos.</CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentMap incidents={filteredIncidents} />
            </CardContent>
          </Card>
          <Card className="">
            <CardHeader>
              <CardTitle>Status dos incidentes</CardTitle>
              <CardDescription>Distribuição atual dos status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusSummary.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariantMap[status]} className="px-2 py-1 text-[0.65rem] font-semibold">
                      {status}
                    </Badge>
                    <span className="text-muted-foreground">{count} incidentes</span>
                  </div>
                  <span className="text-xs text-muted-foreground">atual</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="">
          <CardHeader className='flex-row items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div>
                  <CardTitle>Lista de Incidentes</CardTitle>
                  <CardDescription>{filteredIncidents.length} incidentes encontrados.</CardDescription>
              </div>
         {/* Removed Mock Data badge */}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar incidentes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Filtros
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allStatuses.map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={statusFilters.has(status)}
                      onSelect={e => e.preventDefault()}
                      onCheckedChange={() => setStatusFilters(prev => toggleFilter(prev, status))}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filtrar por Classificação</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   {allClassifications.map(classification => (
                    <DropdownMenuCheckboxItem
                      key={classification}
                      checked={classificationFilters.has(classification)}
                      onSelect={e => e.preventDefault()}
                      onCheckedChange={() => setClassificationFilters(prev => toggleFilter(prev, classification))}
                    >
                      Curva {classification}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredIncidents.map(incident => (
                <Card key={incident.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                          <CardTitle className="text-lg">{incident.itemName}</CardTitle>
                          <CardDescription>{incident.location}</CardDescription>
                      </div>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => openEditDialog(incident)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar Incidente
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                       <Sparkles className="mr-2 h-4 w-4" />
                                      Alterar Status
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                      {allStatuses.map(status => (
                                          <DropdownMenuItem key={status} onSelect={() => handleChangeStatus(incident.id, status)} disabled={incident.status === status}>
                                              {status}
                                          </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuSubContent>
                              </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleDeleteIncident(incident.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Incidente
                </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {incident.description}
                    </p>
                    <div className='flex items-center justify-between'>
                      <Button variant="outline" size="sm" onClick={() => handleAnalysisClick(incident)}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Análise com IA
                      </Button>
                       <Badge variant={statusVariantMap[incident.status]}>
                          {incident.status}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>
                        Aberto{' '}
                        {formatDistanceToNow(new Date(incident.openedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedIncident ? 'Editar Incidente' : 'Registrar Novo Incidente'}</DialogTitle>
            </DialogHeader>
            <IncidentForm
              items={items}
              incident={selectedIncident}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      
       <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Análise de Incidente com IA</DialogTitle>
            </DialogHeader>
           {selectedIncident && <IncidentAnalysis incident={selectedIncident} items={items}/>} 
          </DialogContent>
        </Dialog>
    </div>
  );
}
