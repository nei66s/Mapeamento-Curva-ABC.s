"use client";

import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GestaoEscoposList from '@/components/escopos/GestaoEscoposList.client';

type ServiceStatus = 'Em andamento' | 'Travado' | 'Critico' | 'Concluido';
type Dependency = 'Compras' | 'Fornecedor' | 'Loja' | 'Interno' | 'Terceiros';

interface ServiceItem {
  id: string;
  title: string;
  location: string;
  status: ServiceStatus;
  statusReason: string;
  owner: string;
  dependency: Dependency;
  regional?: string;
  unit?: string;
  stores?: string[];
  category?: string;
  nextAction: string;
  nextFollowupDate: string;
  statusSince: string;
  lastUpdate: string;
  unlockWhat: string;
}

interface AgendaEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  impact: string;
  serviceId: string;
}

interface ChecklistItem {
  id: string;
  date: string;
  shift: string;
  title: string;
  done: boolean;
  serviceId: string;
}

const statusOptions: ServiceStatus[] = ['Em andamento', 'Travado', 'Critico', 'Concluido'];
const dependencyOptions: Dependency[] = ['Compras', 'Fornecedor', 'Loja', 'Interno', 'Terceiros'];
const blockedThresholdDays = 3;
// Units to exclude from area/unit dropdowns (sometimes present in data but not desired here)
const excludedUnits = new Set(['refrigeração', 'refrigeracao']);

const initialServices: ServiceItem[] = [
  {
    id: 'srv-1',
    title: 'Reparo de climatizacao',
    location: 'Loja 12',
    status: 'Em andamento',
    statusReason: 'Equipe em campo',
    owner: 'Equipe Alfa',
    dependency: 'Interno',
    nextAction: 'Confirmar chegada de pecas',
    nextFollowupDate: '2025-01-06',
    statusSince: '2025-01-04',
    lastUpdate: '2025-01-04',
    unlockWhat: '',
  },
  {
    id: 'srv-2',
    title: 'Painel eletrico com risco',
    location: 'CD 02',
    status: 'Travado',
    statusReason: 'Bloqueio de acesso',
    owner: 'Equipe Beta',
    dependency: 'Loja',
    nextAction: 'Liberar acesso com seguranca',
    nextFollowupDate: '2025-01-05',
    statusSince: '2025-01-02',
    lastUpdate: '2025-01-02',
    unlockWhat: 'Liberacao formal da area',
  },
  {
    id: 'srv-3',
    title: 'Falha em iluminacao externa',
    location: 'Loja 03',
    status: 'Critico',
    statusReason: 'Area sem iluminacao',
    owner: 'Equipe Delta',
    dependency: 'Fornecedor',
    nextAction: '',
    nextFollowupDate: '2025-01-05',
    statusSince: '2025-01-05',
    lastUpdate: '2025-01-05',
    unlockWhat: 'Entrega de luminarias',
  },
];

const initialEvents: AgendaEvent[] = [
  {
    id: 'evt-1',
    date: '2025-01-05',
    time: '09:30',
    title: 'Janela para acesso ao CD',
    impact: 'Sem acesso, o painel eletrico nao anda.',
    serviceId: 'srv-2',
  },
  {
    id: 'evt-2',
    date: '2025-01-05',
    time: '16:00',
    title: 'Contato com fornecedor de luminarias',
    impact: 'Define prazo de entrega do material critico.',
    serviceId: 'srv-3',
  },
];

const initialChecklist: ChecklistItem[] = [
  {
    id: 'chk-1',
    date: '2025-01-05',
    shift: 'Manha',
    title: 'Atualizar status das equipes em campo',
    done: false,
    serviceId: 'srv-1',
  },
  {
    id: 'chk-2',
    date: '2025-01-05',
    shift: 'Manha',
    title: 'Cobrar liberacao de acesso no CD 02',
    done: false,
    serviceId: 'srv-2',
  },
];

const statusVariant = (status: ServiceStatus) => {
  if (status === 'Critico') return 'destructive';
  if (status === 'Travado') return 'secondary';
  return 'outline';
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const parseDateTime = (date: string, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const base = new Date(date);
  base.setHours(hours || 0, minutes || 0, 0, 0);
  return base;
};

const daysSince = (dateISO?: string) => {
  if (!dateISO) return 0;
  const start = new Date(dateISO);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

import styles from './page.module.css';

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [escoposData, setEscoposData] = useState<any[]>([]);
  const [escoposError, setEscoposError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState(todayISO());
  const [activeShift, setActiveShift] = useState('Manha');

  const [serviceDraft, setServiceDraft] = useState<ServiceItem>({
    id: '',
    title: '',
    location: '',
    status: 'Em andamento',
    statusReason: '',
    owner: '',
    dependency: 'Interno',
    nextAction: '',
    nextFollowupDate: activeDate,
    statusSince: activeDate,
    lastUpdate: activeDate,
    unlockWhat: '',
    regional: '',
    unit: '',
    stores: [],
    category: '',
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState('');
  const [allStores, setAllStores] = useState<{ id: string; name: string; location?: string }[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [tempStoreSelection, setTempStoreSelection] = useState<Record<string, boolean>>({});

  const [eventDraft, setEventDraft] = useState<AgendaEvent>({
    id: '',
    date: activeDate,
    time: '',
    title: '',
    impact: '',
    serviceId: '',
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [checklistDraft, setChecklistDraft] = useState<ChecklistItem>({
    id: '',
    date: activeDate,
    shift: activeShift,
    title: '',
    done: false,
    serviceId: 'none',
  });
  // fetch escopos from server API and show them in the Services page
  useEffect(() => {
    let mounted = true;
    fetch('/api/escopos')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        console.debug('[services] /api/escopos response:', json);
        if (json && json.ok && Array.isArray(json.result)) {
          setEscoposData(json.result);
          setEscoposError(null);
        } else {
          setEscoposData([]);
          setEscoposError(json?.error ? String(json.error) : 'Resposta inesperada do servidor');
          console.error('[services] /api/escopos error:', json);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[services] fetch /api/escopos failed', err);
        setEscoposError(String(err?.message || err));
      });
    return () => {
      mounted = false;
    };
  }, []);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const serviceMap = useMemo(() => {
    return services.reduce<Record<string, ServiceItem>>((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {});
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      // filterArea can be a Regional (e.g., 'Regional 01') or 'Unidades Estratégicas'
      if (filterArea !== 'all') {
        if (filterArea.startsWith('Regional')) {
          if ((s.regional || '') !== filterArea) return false;
        } else if (filterArea === 'Unidades Estratégicas') {
          if (filterUnit !== 'all' && (s.unit || '') !== filterUnit) return false;
        } else {
          if ((s.unit || '') !== filterArea) return false;
        }
      }
      if (filterCategory !== 'all') {
        const u = (s.unit || '').toLowerCase();
        if (!u.includes(filterCategory.toLowerCase())) return false;
      }
      return true;
    });
  }, [services, filterArea, filterCategory]);

  const normalizeDbService = (row: any): ServiceItem => {
    return {
      id: row.id,
      title: row.title || '',
      location: row.location || '',
      status: (row.status as ServiceStatus) || 'Em andamento',
      statusReason: row.status_reason || row.statusReason || '',
      owner: row.owner || '',
      dependency: row.dependency || 'Interno',
      regional: row.regional || row.regional || '',
      unit: row.unit || row.unit || '',
      stores: Array.isArray(row.stores) ? row.stores : [],
      nextAction: row.next_action || row.nextAction || '',
      nextFollowupDate: row.next_followup_date
        ? new Date(row.next_followup_date).toISOString().slice(0, 10)
        : row.nextFollowupDate || activeDate,
      statusSince: row.status_since
        ? new Date(row.status_since).toISOString().slice(0, 10)
        : row.statusSince || activeDate,
      lastUpdate: row.last_update ? new Date(row.last_update).toISOString().slice(0, 10) : row.lastUpdate || activeDate,
      unlockWhat: row.unlock_what || row.unlockWhat || '',
    };
  };

  const actionableMetrics = useMemo(() => {
    const criticalNoAction = services.filter(
      service => service.status === 'Critico' && !service.nextAction.trim()
    ).length;
    const blocked = services.filter(service => service.status === 'Travado').length;
    const followupsDue = services.filter(service => {
      if (!service.nextFollowupDate) return false;
      return service.nextFollowupDate === activeDate && service.status !== 'Concluido';
    }).length;
      return [
      { label: 'Críticos sem próxima ação', value: criticalNoAction },
      { label: 'Serviços travados', value: blocked },
      { label: 'Follow-ups vencidos hoje', value: followupsDue },
    ];
  }, [services, activeDate]);

  const blockedGroups = useMemo(() => {
    const groups: Record<string, ServiceItem[]> = {};
    services
      .filter(service => service.status === 'Travado')
      .forEach(service => {
        const key = service.statusReason || 'Sem motivo';
        groups[key] = groups[key] ? [...groups[key], service] : [service];
      });
    return groups;
  }, [services]);

  const agendaForDay = useMemo(
    () => events.filter(event => event.date === activeDate),
    [events, activeDate]
  );

  const checklistForShift = useMemo(
    () => checklist.filter(item => item.date === activeDate && item.shift === activeShift),
    [checklist, activeDate, activeShift]
  );

  const resetServiceDraft = () => {
    setServiceDraft({
      id: '',
      title: '',
      location: '',
      status: 'Em andamento',
      statusReason: '',
      owner: '',
      dependency: 'Interno',
      nextAction: '',
      nextFollowupDate: activeDate,
      statusSince: activeDate,
      lastUpdate: activeDate,
      unlockWhat: '',
      regional: '',
      unit: '',
      stores: [],
      category: '',
    });
    setEditingServiceId(null);
    setServiceError('');
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingStores(true);
      try {
        const res = await fetch('/api/stores');
        if (!res.ok) return setAllStores([]);
        const data = await res.json();
        if (!mounted) return;
        setAllStores(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('load stores', err);
        setAllStores([]);
      } finally {
        if (mounted) setLoadingStores(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveService = () => {
    if (!serviceDraft.title.trim()) return setServiceError('Serviço obrigatório.');
    if (!serviceDraft.location.trim()) return setServiceError('Local ou loja obrigatório.');
    if (!serviceDraft.owner.trim()) return setServiceError('Responsável obrigatório.');

    (async () => {
      const payload: any = {
        ...serviceDraft,
        lastUpdate: todayISO(),
        areaType: null,
        areaValue: null,
        category: serviceDraft.category || null,
        stores: serviceDraft.stores || [],
      };

      if (serviceDraft.regional && serviceDraft.regional.startsWith('Regional')) {
        payload.areaType = 'regional';
        payload.areaValue = serviceDraft.regional;
      } else if (serviceDraft.regional === 'Unidades Estratégicas' || serviceDraft.unit) {
        payload.areaType = 'unit';
        payload.areaValue = serviceDraft.unit || null;
      }

      try {
        if (editingServiceId) {
          const res = await fetch(`/api/services/${editingServiceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) return setServiceError(json.error || 'Erro ao atualizar');
          setServices(prev => prev.map(service => (service.id === editingServiceId ? normalizeDbService(json.result) : service)));
        } else {
          const res = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok || !json.ok) return setServiceError(json.error || 'Erro ao criar');
          setServices(prev => [normalizeDbService(json.result), ...prev]);
        }
        resetServiceDraft();
      } catch (err) {
        console.error(err);
        setServiceError('Falha de rede ao salvar.');
      }
    })();
  };

  const editService = (service: ServiceItem) => {
    setServiceDraft(service);
    setEditingServiceId(service.id);
    setServiceError('');
  };

  const deleteService = (id: string) => {
    (async () => {
      try {
        const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.ok) return;
        setServices(prev => prev.filter(service => service.id !== id));
        if (editingServiceId === id) resetServiceDraft();
      } catch (err) {
        console.error('deleteService', err);
      }
    })();
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/services');
        const text = await res.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (parseErr) {
          console.error('Failed to parse /api/services response as JSON', parseErr, text);
        }

        if (res.ok && json?.ok && Array.isArray(json.result)) {
          setServices(json.result.map((r: any) => normalizeDbService(r)));
        } else if (!res.ok) {
          console.error('/api/services returned', res.status, res.statusText);
        }
      } catch (err) {
        console.error('load services', err);
      }
    })();
  }, []);

  const resetEventDraft = () => {
    setEventDraft({
      id: '',
      date: activeDate,
      time: '',
      title: '',
      impact: '',
      serviceId: '',
    });
    setEditingEventId(null);
  };

  const saveEvent = () => {
    if (!eventDraft.date || !eventDraft.time || !eventDraft.title.trim()) return;
    if (editingEventId) {
      setEvents(prev => prev.map(event => (event.id === editingEventId ? eventDraft : event)));
    } else {
      setEvents(prev => [{ ...eventDraft, id: `evt-${Date.now()}` }, ...prev]);
    }
    resetEventDraft();
  };

  const editEvent = (event: AgendaEvent) => {
    setEventDraft(event);
    setEditingEventId(event.id);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
    if (editingEventId === id) resetEventDraft();
  };

  const resetChecklistDraft = () => {
    setChecklistDraft({
      id: '',
      date: activeDate,
      shift: activeShift,
      title: '',
      done: false,
      serviceId: 'none',
    });
    setEditingChecklistId(null);
  };

  const saveChecklistItem = () => {
    if (!checklistDraft.title.trim()) return;
    if (editingChecklistId) {
      setChecklist(prev => prev.map(item => (item.id === editingChecklistId ? checklistDraft : item)));
    } else {
      setChecklist(prev => [{ ...checklistDraft, id: `chk-${Date.now()}` }, ...prev]);
    }
    resetChecklistDraft();
  };

  const editChecklistItem = (item: ChecklistItem) => {
    setChecklistDraft({ ...item, serviceId: item.serviceId || 'none' });
    setEditingChecklistId(item.id);
  };

  const toggleChecklistDone = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const deleteChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
    if (editingChecklistId === id) resetChecklistDraft();
  };

  return (
    <div className={`${styles.root} space-y-6`}>
      <PageHeader
        title="Serviços"
        description="Painel leve para destravar pendências e priorizar ações do dia."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {actionableMetrics.map(metric => (
          <Card key={metric.label} className="bg-card/70 border border-surface-border">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {metric.label}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="bg-card/60 border border-surface-border">
        <CardHeader>
          <CardTitle>Escopos / Serviços</CardTitle>
          <CardDescription>Escopos criados (visão integrada com Serviços)</CardDescription>
        </CardHeader>
        <CardContent>
          {escoposError ? (
            <div className="p-4 text-sm text-destructive">Erro ao carregar escopos: {escoposError}</div>
          ) : (
            <GestaoEscoposList initialData={escoposData} />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 items-center">
        <div className="w-56">
          <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Área</label>
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Regional 01">Regional 01</SelectItem>
              <SelectItem value="Regional 02">Regional 02</SelectItem>
              <SelectItem value="Regional 03">Regional 03</SelectItem>
              <SelectItem value="Regional 04">Regional 04</SelectItem>
              <SelectItem value="Unidades Estratégicas">Unidades Estratégicas</SelectItem>
              {Array.from(new Set(services.map(s => s.unit || '')))
                .filter(Boolean)
                .filter(u => !excludedUnits.has(u.toLowerCase()))
                .map(u => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {filterArea === 'Unidades Estratégicas' && (
          <div className="w-56">
            <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Unidade</label>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Array.from(new Set(services.map(s => s.unit || '')))
                  .filter(Boolean)
                  .filter(u => !excludedUnits.has(u.toLowerCase()))
                  .map(u => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="w-56">
          <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Categoria</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Manutenção">Manutenção</SelectItem>
              <SelectItem value="Refrigeração">Refrigeração</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/60 border border-surface-border">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Serviços em execução</CardTitle>
              <CardDescription>
                Controle focado em próxima ação, bloqueios e cobranças pendentes.
              </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={resetServiceDraft}>
              Novo serviço
            </Button>
            <Input
              type="date"
              value={activeDate}
              onChange={event => setActiveDate(event.target.value)}
              className="w-auto"
            />
          </div>
        </CardHeader>
          <CardContent className="space-y-4">
          <div className="rounded-2xl border border-surface-border bg-card/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:items-end">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Serviço</label>
                <Input
                  value={serviceDraft.title}
                  onChange={event => setServiceDraft({ ...serviceDraft, title: event.target.value })}
                  placeholder="Ex: Troca de compressor"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Responsável</label>
                <Input
                  value={serviceDraft.owner}
                  onChange={event => setServiceDraft({ ...serviceDraft, owner: event.target.value })}
                  placeholder="Equipe / Pessoa"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Área</label>
                <Select value={serviceDraft.regional || ''} onValueChange={value => setServiceDraft({ ...serviceDraft, regional: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem regional</SelectItem>
                    <SelectItem value="Regional 01">Regional 01</SelectItem>
                    <SelectItem value="Regional 02">Regional 02</SelectItem>
                    <SelectItem value="Regional 03">Regional 03</SelectItem>
                    <SelectItem value="Regional 04">Regional 04</SelectItem>
                    <SelectItem value="Unidades Estratégicas">Unidades Estratégicas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Categoria</label>
                <Select value={serviceDraft.category || ''} onValueChange={value => setServiceDraft({ ...serviceDraft, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Refrigeração">Refrigeração</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Próxima ação</label>
                <Input
                  value={serviceDraft.nextAction}
                  onChange={event => setServiceDraft({ ...serviceDraft, nextAction: event.target.value })}
                  placeholder="Ex: cobrar compras"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Lojas</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {(serviceDraft.stores || []).length > 0
                        ? (serviceDraft.stores || []).slice(0, 2).join(', ') + ((serviceDraft.stores || []).length > 2 ? ` +${(serviceDraft.stores || []).length - 2}` : '')
                        : (loadingStores ? 'Carregando lojas…' : 'Selecionar lojas')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2">
                    <div className="max-h-56 overflow-y-auto">
                      {loadingStores && <div className="text-sm text-muted-foreground p-2">Carregando...</div>}
                      {!loadingStores && allStores.map(store => {
                        const checked = !!tempStoreSelection[store.name] || (serviceDraft.stores || []).includes(store.name);
                        return (
                          <label key={store.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setTempStoreSelection(prev => ({ ...prev, [store.name]: !checked }));
                              }}
                            />
                            <div className="text-sm">{store.name}</div>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => { setTempStoreSelection({}); setServiceDraft({ ...serviceDraft, stores: [] }); }}>
                        Limpar
                      </Button>
                      <Button onClick={() => {
                        const selected = new Set<string>(serviceDraft.stores || []);
                        Object.keys(tempStoreSelection).forEach(name => {
                          if (tempStoreSelection[name]) selected.add(name); else selected.delete(name);
                        });
                        setServiceDraft({ ...serviceDraft, stores: Array.from(selected) });
                        setTempStoreSelection({});
                      }}>
                        Aplicar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Data</label>
                <Input
                  type="date"
                  value={serviceDraft.nextFollowupDate}
                  onChange={event => setServiceDraft({ ...serviceDraft, nextFollowupDate: event.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button onClick={saveService}>{editingServiceId ? 'Salvar' : 'Adicionar'}</Button>
              <Button variant="ghost" onClick={() => setShowAdvanced(v => !v)}>
                {showAdvanced ? 'Esconder campos' : 'Mais campos'}
              </Button>
              {editingServiceId && (
                <Button variant="ghost" onClick={resetServiceDraft}>
                  Cancelar
                </Button>
              )}
            </div>

            {showAdvanced && (
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status manual</label>
                  <Select
                    value={serviceDraft.status}
                    onValueChange={value => setServiceDraft({ ...serviceDraft, status: value as ServiceStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Motivo</label>
                  <Input value={serviceDraft.statusReason} onChange={e => setServiceDraft({ ...serviceDraft, statusReason: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">O que falta</label>
                  <Input value={serviceDraft.unlockWhat} onChange={e => setServiceDraft({ ...serviceDraft, unlockWhat: e.target.value })} />
                </div>
                {(showAdvanced || serviceDraft.regional === 'Unidades Estratégicas') && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Unidade estratégica</label>
                    <Input value={serviceDraft.unit} onChange={e => setServiceDraft({ ...serviceDraft, unit: e.target.value })} placeholder="Ex: Refrigeracao" />
                  </div>
                )}
              </div>
            )}
          </div>
          {serviceError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
              {serviceError}
            </div>
          )}
          {/* primary actions are shown above the advanced section to keep the form compact */}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Próxima ação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map(service => {
                const noNextAction = !(service.nextAction || '').trim();
                const blockedTooLong =
                  service.status === 'Travado' && daysSince(service.statusSince) > blockedThresholdDays;
                return (
                  <TableRow
                    key={service.id}
                    className={`border-surface-border ${noNextAction ? 'bg-rose-500/10' : ''}`}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{service.title}</p>
                        {/* dependency intentionally hidden to reduce visual noise */}
                      </div>
                    </TableCell>
                    <TableCell>{service.location}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
                        {blockedTooLong && (
                          <Badge variant="destructive">
                            Travado ha {daysSince(service.statusSince)} dias
                          </Badge>
                        )}
                        {noNextAction && (
                          <Badge variant="destructive">Sem próxima ação</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{service.owner}</TableCell>
                    <TableCell>
                      <p className="text-sm">{service.nextAction || 'Definir próxima ação'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{service.nextFollowupDate}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => editService(service)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteService(service.id)}>
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border border-surface-border">
        <CardHeader>
          <CardTitle>Serviços travados (visão dedicada)</CardTitle>
          <CardDescription>Separado por motivo do bloqueio com foco em destravar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(blockedGroups).length === 0 && (
            <div className="rounded-2xl border border-surface-border bg-card/5 p-4 text-sm text-muted-foreground">
              Nenhum serviço travado no momento.
            </div>
          )}
          {Object.entries(blockedGroups).map(([reason, items]) => (
            <div key={reason} className="rounded-2xl border border-surface-border bg-card/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">{reason}</p>
                <Badge variant="secondary">{items.length} serviços</Badge>
              </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                {items.map(service => (
                  <div key={service.id} className="rounded-2xl border border-surface-border bg-card/60 p-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{service.title}</span>
                      <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        {service.location}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      O que falta: {service.unlockWhat || 'Definir destrave'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Desde {service.statusSince}</span>
                      <span>Responsável: {service.owner}</span>
                      <Button size="sm" variant="ghost" onClick={() => editService(service)}>
                        Atualizar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/60 border border-surface-border">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Agenda do turno</CardTitle>
              <CardDescription>Eventos vinculados aos serviços para evitar esquecimento.</CardDescription>
            </div>
            <Input
              type="date"
              value={activeDate}
              onChange={event => setActiveDate(event.target.value)}
              className="w-auto"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-surface-border bg-card/5 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Horario</label>
                <Input
                  type="time"
                  value={eventDraft.time}
                  onChange={event => setEventDraft({ ...eventDraft, time: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Serviço relacionado</label>
                <Select
                  value={eventDraft.serviceId}
                  onValueChange={value => setEventDraft({ ...eventDraft, serviceId: value })}
                >
                    <SelectTrigger>
                    <SelectValue placeholder="Vincular serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Evento</label>
                <Input
                  value={eventDraft.title}
                  onChange={event => setEventDraft({ ...eventDraft, title: event.target.value })}
                  placeholder="Ex: liberar acesso, visita do fornecedor"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Impacto no serviço</label>
                <Input
                  value={eventDraft.impact}
                  onChange={event => setEventDraft({ ...eventDraft, impact: event.target.value })}
                  placeholder="Ex: sem acesso nao inicia trabalho"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveEvent}>{editingEventId ? 'Salvar evento' : 'Adicionar evento'}</Button>
              {editingEventId && (
                <Button variant="ghost" onClick={resetEventDraft}>
                  Cancelar
                </Button>
              )}
            </div>
            {agendaForDay.length === 0 && (
              <div className="rounded-2xl border border-surface-border bg-card/5 p-3 text-sm text-muted-foreground">
                Nenhum evento para este dia.
              </div>
            )}
            <div className="space-y-3">
              {agendaForDay.map(event => {
                const service = serviceMap[event.serviceId];
                const eventTime = parseDateTime(event.date, event.time);
                const isLate =
                  service && eventTime.getTime() < Date.now() &&
                  new Date(service.lastUpdate).getTime() < eventTime.getTime();
                return (
                  <div
                    key={event.id}
                    className={`rounded-2xl border border-surface-border p-4 ${
                      isLate ? 'bg-rose-500/10' : 'bg-card/5'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          {event.time}
                        </span>
                        <span>{event.title}</span>
                        {isLate && <Badge variant="destructive">Atrasado</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => editEvent(event)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteEvent(event.id)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{event.impact}</p>
                    {service && (
                      <div className="mt-3 rounded-xl border border-surface-border bg-card/60 p-3 text-sm">
                        <div className="flex items-center justify-between text-surface-foreground">
                          <span>{service.title}</span>
                          <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          <span>Próxima ação</span>
                          <span>{service.nextAction || 'Definir'}</span>
                        </div>
                        <Progress value={service.nextAction ? 70 : 20} className="mt-2 h-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border border-surface-border">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Checklist operacional</CardTitle>
              <CardDescription>Checklist editável por dia e turno, com vínculo ao serviço.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                type="date"
                value={activeDate}
                onChange={event => setActiveDate(event.target.value)}
                className="w-auto"
              />
              <Select value={activeShift} onValueChange={setActiveShift}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  {['Manha', 'Tarde', 'Noite'].map(shift => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-surface-border bg-card/5 p-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Item do checklist</label>
                <Input
                  value={checklistDraft.title}
                  onChange={event => setChecklistDraft({ ...checklistDraft, title: event.target.value })}
                  placeholder="Ex: cobrar fornecedor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Serviço vinculado</label>
                <Select
                  value={checklistDraft.serviceId}
                  onValueChange={value => setChecklistDraft({ ...checklistDraft, serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="none">Sem serviço</SelectItem>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveChecklistItem}>
                {editingChecklistId ? 'Salvar item' : 'Adicionar item'}
              </Button>
              {editingChecklistId && (
                <Button variant="ghost" onClick={resetChecklistDraft}>
                  Cancelar
                </Button>
              )}
            </div>
            {checklistForShift.length === 0 && (
              <div className="rounded-2xl border border-surface-border bg-card/5 p-3 text-sm text-muted-foreground">
                Nenhum item para este turno.
              </div>
            )}
            <div className="space-y-3">
              {checklistForShift.map(item => {
                const service = serviceMap[item.serviceId];
                return (
                  <div
                      key={item.id}
                      className="rounded-2xl border border-surface-border bg-card/5 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'text-surface-foreground'}`}>
                            {item.title}
                          </p>
                          {service && (
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                              {service.title}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toggleChecklistDone(item.id)}>
                            {item.done ? 'Reabrir' : 'Concluir'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => editChecklistItem(item)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteChecklistItem(item.id)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
