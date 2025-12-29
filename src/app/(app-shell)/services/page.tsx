"use client";

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
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
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState('');

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
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);

  const serviceMap = useMemo(() => {
    return services.reduce<Record<string, ServiceItem>>((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {});
  }, [services]);

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
      { label: 'Criticos sem proxima acao', value: criticalNoAction },
      { label: 'Servicos travados', value: blocked },
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
    });
    setEditingServiceId(null);
    setServiceError('');
  };

  const saveService = () => {
    if (!serviceDraft.title.trim()) return setServiceError('Servico obrigatorio.');
    if (!serviceDraft.location.trim()) return setServiceError('Local ou loja obrigatorio.');
    if (!serviceDraft.statusReason.trim()) return setServiceError('Motivo do status obrigatorio.');
    if (!serviceDraft.owner.trim()) return setServiceError('Responsavel obrigatorio.');
    if (!serviceDraft.nextAction.trim()) return setServiceError('Proxima acao obrigatoria.');
    if (!serviceDraft.nextFollowupDate.trim()) return setServiceError('Data de cobranca obrigatoria.');

    const draft = {
      ...serviceDraft,
      lastUpdate: todayISO(),
    };

    if (editingServiceId) {
      setServices(prev => prev.map(service => (service.id === editingServiceId ? draft : service)));
    } else {
      setServices(prev => [
        { ...draft, id: `srv-${Date.now()}` },
        ...prev,
      ]);
    }
    resetServiceDraft();
  };

  const editService = (service: ServiceItem) => {
    setServiceDraft(service);
    setEditingServiceId(service.id);
    setServiceError('');
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
    if (editingServiceId === id) resetServiceDraft();
  };

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
    <div className="space-y-6">
      <PageHeader
        title="Gestao de Servicos"
        description="Controle manual para destravar pendencias e tomar decisao diaria sem depender do SAP."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {actionableMetrics.map(metric => (
          <Card key={metric.label} className="bg-slate-900/60">
            <CardHeader className="space-y-3">
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {metric.label}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-950/50">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Servicos em execucao</CardTitle>
            <CardDescription>
              Controle manual com foco em proxima acao, bloqueios e cobranca ativa.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={resetServiceDraft}>
              Novo servico
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
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Servico</label>
              <Input
                value={serviceDraft.title}
                onChange={event => setServiceDraft({ ...serviceDraft, title: event.target.value })}
                placeholder="Ex: Troca de compressor"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Loja ou local</label>
              <Input
                value={serviceDraft.location}
                onChange={event => setServiceDraft({ ...serviceDraft, location: event.target.value })}
                placeholder="Ex: Loja 08"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Status manual</label>
              <Select
                value={serviceDraft.status}
                onValueChange={value =>
                  setServiceDraft({ ...serviceDraft, status: value as ServiceStatus })
                }
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
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Motivo do status</label>
              <Input
                value={serviceDraft.statusReason}
                onChange={event => setServiceDraft({ ...serviceDraft, statusReason: event.target.value })}
                placeholder="Ex: aguardando liberacao"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Responsavel atual</label>
              <Input
                value={serviceDraft.owner}
                onChange={event => setServiceDraft({ ...serviceDraft, owner: event.target.value })}
                placeholder="Equipe / pessoa"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Dependencia</label>
              <Select
                value={serviceDraft.dependency}
                onValueChange={value =>
                  setServiceDraft({ ...serviceDraft, dependency: value as Dependency })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {dependencyOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Proxima acao</label>
              <Input
                value={serviceDraft.nextAction}
                onChange={event => setServiceDraft({ ...serviceDraft, nextAction: event.target.value })}
                placeholder="Ex: cobrar compras ate 15h"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Data da cobranca</label>
              <Input
                type="date"
                value={serviceDraft.nextFollowupDate}
                onChange={event =>
                  setServiceDraft({ ...serviceDraft, nextFollowupDate: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Status desde</label>
              <Input
                type="date"
                value={serviceDraft.statusSince}
                onChange={event =>
                  setServiceDraft({ ...serviceDraft, statusSince: event.target.value })
                }
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">O que falta para destravar</label>
              <Input
                value={serviceDraft.unlockWhat}
                onChange={event => setServiceDraft({ ...serviceDraft, unlockWhat: event.target.value })}
                placeholder="Ex: liberacao da loja, entrega de material"
              />
            </div>
          </div>
          {serviceError && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">
              {serviceError}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={saveService}>
              {editingServiceId ? 'Salvar atualizacao' : 'Registrar servico'}
            </Button>
            {editingServiceId && (
              <Button variant="ghost" onClick={resetServiceDraft}>
                Cancelar
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servico</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Responsavel</TableHead>
                <TableHead>Proxima acao</TableHead>
                <TableHead>Cobranca</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map(service => {
                const noNextAction = !service.nextAction.trim();
                const blockedTooLong =
                  service.status === 'Travado' && daysSince(service.statusSince) > blockedThresholdDays;
                return (
                  <TableRow
                    key={service.id}
                    className={`border-white/5 ${noNextAction ? 'bg-rose-500/10' : ''}`}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{service.title}</p>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                          {service.dependency}
                        </p>
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
                          <Badge variant="destructive">Sem proxima acao</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{service.statusReason}</TableCell>
                    <TableCell>{service.owner}</TableCell>
                    <TableCell>
                      <p className="text-sm">{service.nextAction || 'Definir proxima acao'}</p>
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

      <Card className="bg-slate-950/50">
        <CardHeader>
          <CardTitle>Servicos travados (visao dedicada)</CardTitle>
          <CardDescription>Separado por motivo do bloqueio com foco em destravar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(blockedGroups).length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              Nenhum servico travado no momento.
            </div>
          )}
          {Object.entries(blockedGroups).map(([reason, items]) => (
            <div key={reason} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{reason}</p>
                <Badge variant="secondary">{items.length} servicos</Badge>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {items.map(service => (
                  <div key={service.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>{service.title}</span>
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                        {service.location}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                      O que falta: {service.unlockWhat || 'Definir destrave'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Desde {service.statusSince}</span>
                      <span>Responsavel: {service.owner}</span>
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
        <Card className="bg-slate-950/50">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Agenda do turno</CardTitle>
              <CardDescription>Eventos vinculados aos servicos para evitar esquecimento.</CardDescription>
            </div>
            <Input
              type="date"
              value={activeDate}
              onChange={event => setActiveDate(event.target.value)}
              className="w-auto"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Horario</label>
                <Input
                  type="time"
                  value={eventDraft.time}
                  onChange={event => setEventDraft({ ...eventDraft, time: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Servico relacionado</label>
                <Select
                  value={eventDraft.serviceId}
                  onValueChange={value => setEventDraft({ ...eventDraft, serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vincular servico" />
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
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Evento</label>
                <Input
                  value={eventDraft.title}
                  onChange={event => setEventDraft({ ...eventDraft, title: event.target.value })}
                  placeholder="Ex: liberar acesso, visita do fornecedor"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Impacto no servico</label>
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
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
                    className={`rounded-2xl border border-white/10 p-4 ${
                      isLate ? 'bg-rose-500/10' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
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
                    <p className="mt-2 text-sm text-slate-400">{event.impact}</p>
                    {service && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{service.title}</span>
                          <Badge variant={statusVariant(service.status)}>{service.status}</Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                          <span>Proxima acao</span>
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

        <Card className="bg-slate-950/50">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Checklist operacional</CardTitle>
              <CardDescription>Checklist editavel por dia e turno, com vinculo ao servico.</CardDescription>
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
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Item do checklist</label>
                <Input
                  value={checklistDraft.title}
                  onChange={event => setChecklistDraft({ ...checklistDraft, title: event.target.value })}
                  placeholder="Ex: cobrar fornecedor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Servico vinculado</label>
                <Select
                  value={checklistDraft.serviceId}
                  onValueChange={value => setChecklistDraft({ ...checklistDraft, serviceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="none">Sem servico</SelectItem>
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                Nenhum item para este turno.
              </div>
            )}
            <div className="space-y-3">
              {checklistForShift.map(item => {
                const service = serviceMap[item.serviceId];
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className={`text-sm ${item.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.title}
                        </p>
                        {service && (
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
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
