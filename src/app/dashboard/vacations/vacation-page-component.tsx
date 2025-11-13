'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { VacationList } from './vacation-list';
import type { VacationRequest, User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getYear, isWeekend, parseISO, eachDayOfInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { VacationForm } from './vacation-form';
import { useToast } from '@/hooks/use-toast';
import { upsertRule, removeRule } from '@/lib/dynamic-styles';
import { Skeleton } from '@/components/ui/skeleton';
import { VacationRoadmap } from './vacation-roadmap';


interface VacationPageComponentProps {
  initialVacations: VacationRequest[];
  allUsers: User[];
}

const colorPalette = [
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
];

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 3; i++) {
        years.push(i);
    }
    return years;
}

export function VacationPageComponent({ initialVacations, allUsers }: VacationPageComponentProps) {
  const [allVacations, setAllVacations] = useState<VacationRequest[]>(initialVacations);
  const [visibleUsers, setVisibleUsers] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    (initialVacations || []).forEach(v => { if (v?.userId) ids.add(String(v.userId)); });
    // fallback to all users if there are no vacations
    if (ids.size === 0) return new Set(allUsers.map(u => u.id));
    return ids;
  });
  const [extraUsers, setExtraUsers] = useState<User[]>([]);
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [holidays, setHolidays] = useState<Date[]>([]); // kept for compatibility, but not used for roadmap-only view
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const vacationsForYear = useMemo(() => {
    return allVacations.filter(v => getYear(new Date(v.startDate)) === displayYear || getYear(new Date(v.endDate)) === displayYear);
  }, [allVacations, displayYear]);

  const baseUsers = useMemo(() => [...allUsers, ...extraUsers], [allUsers, extraUsers]);

  const vacationOnlyUsers = useMemo(() => {
    const knownIds = new Set(baseUsers.map(u => u.id));
    const generated = new Map<string, User>();

    vacationsForYear.forEach(vacation => {
      if (vacation.status !== 'Aprovado') return;
      if (!vacation.userId || knownIds.has(vacation.userId) || generated.has(vacation.userId)) return;

      const safeIdSegment = vacation.userId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'colaborador';
      const placeholderEmail = `${safeIdSegment}@ferias.local`;
      generated.set(vacation.userId, {
        id: vacation.userId,
        name: vacation.userName || `Colaborador ${vacation.userId}`,
        email: placeholderEmail,
        role: 'visualizador',
        avatarUrl: vacation.userAvatarUrl,
        department: vacation.userDepartment,
      });
    });

    return Array.from(generated.values());
  }, [vacationsForYear, baseUsers]);

  useEffect(() => {
    if (vacationOnlyUsers.length === 0) return;
    setVisibleUsers(prev => {
      const next = new Set(prev);
      let changed = false;
      vacationOnlyUsers.forEach(user => {
        if (!next.has(user.id)) {
          next.add(user.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [vacationOnlyUsers]);

  const combinedUsers = useMemo(() => [...baseUsers, ...vacationOnlyUsers], [baseUsers, vacationOnlyUsers]);

  const userColors = useMemo(() => {
    const colors: Record<string, string> = {};
    combinedUsers.forEach((user, index) => {
      colors[user.id] = colorPalette[index % colorPalette.length];
    });
    return colors;
  }, [combinedUsers]);

  // Inject CSS classes for each user color (used by child components)
  useEffect(() => {
    combinedUsers.forEach(u => {
      const id = `user-color-${u.id}`;
      const css = `
        .vac-user-dot-${u.id} { background-color: ${userColors[u.id]} !important; }
        .vac-user-color-${u.id} { background-color: ${userColors[u.id]} !important; }
      `;
      upsertRule(id, css);
    });

    return () => {
      combinedUsers.forEach(u => removeRule(`user-color-${u.id}`));
    };
  }, [combinedUsers, userColors]);
  
  const yearOptions = useMemo(() => generateYearOptions(), []);

  useEffect(() => {
    // For roadmap-only view we rely on server-provided `totalDays` when available.
    // Fallback: compute business days ignoring holidays (simpler and deterministic).
    setLoading(true);
    try {
      const updatedVacations = initialVacations.map(vacation => ({
        ...vacation,
        totalDays: typeof vacation.totalDays === 'number' && vacation.totalDays >= 0
          ? vacation.totalDays
          : eachDayOfInterval({ start: parseISO(vacation.startDate), end: parseISO(vacation.endDate) }).filter(day => !isWeekend(day)).length,
      }));
      setAllVacations(updatedVacations);
    } catch (e) {
      console.error('Error calculating total days for vacations', e);
      setAllVacations(initialVacations);
    } finally {
      setLoading(false);
    }
  }, [displayYear, initialVacations, toast]);


  const handleUserVisibilityChange = (userId: string) => {
    setVisibleUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  
  const handleAddVacation = async (data: Omit<VacationRequest, 'id' | 'requestedAt' | 'status' | 'userName' | 'userAvatarUrl' | 'totalDays'> & { userName?: string; userDepartment?: string }) => {
    // Try to resolve user by id first, then by provided userName
    let user = allUsers.find(u => u.id === data.userId);
    if (!user && data.userName) {
      user = allUsers.find(u => u.name.toLowerCase() === data.userName!.toLowerCase());
    }
    
    // compute business days (simple: exclude weekends). Holidays are not considered in roadmap-only view.
    let totalDays = 0;
    try {
      totalDays = eachDayOfInterval({ start: parseISO(data.startDate), end: parseISO(data.endDate) }).filter(day => !isWeekend(day)).length;
    } catch (e) {
      console.error('Error calculating business days on add:', e);
      totalDays = Math.max(0, Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)));
    }


    // Ensure API receives a non-empty userId: prefer provided id, then match by name, else generate a synthetic id
    let apiUserId: string | undefined = undefined;
    if (data.userId && String(data.userId).trim().length > 0) apiUserId = data.userId;
    else if (data.userName) {
      const matched = allUsers.find(u => u.name.toLowerCase() === data.userName!.toLowerCase());
      if (matched) apiUserId = matched.id;
    }

    // If still no apiUserId, generate a synthetic id and create a local synthetic user so the record persists and appears in the roadmap/list
    let createdSyntheticUserId: string | undefined = undefined;
    let createdSyntheticUserName: string | undefined = undefined;
    if (!apiUserId) {
      createdSyntheticUserId = `local-user-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      apiUserId = createdSyntheticUserId;
      const syntheticUser = {
        id: createdSyntheticUserId,
        name: data.userName || `Usuário ${createdSyntheticUserId}`,
        avatarUrl: undefined,
        department: data.userDepartment || 'N/A',
      } as User;
      createdSyntheticUserName = syntheticUser.name;
      // add synthetic user locally so UI shows it immediately
      setExtraUsers(prev => [...prev, syntheticUser]);
      setVisibleUsers(prev => {
        const next = new Set(prev);
        next.add(createdSyntheticUserId!);
        return next;
      });
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const css = `
        .vac-user-dot-${createdSyntheticUserId} { background-color: ${color} !important; }
        .vac-user-color-${createdSyntheticUserId} { background-color: ${color} !important; }
      `;
      upsertRule(`user-color-${createdSyntheticUserId}`, css);
    }

    try {
      const payloadUserDepartment = data.userDepartment ?? user?.department ?? 'N/A';

      const payloadUserName = data.userName ?? user?.name ?? createdSyntheticUserName;
      const res = await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: apiUserId, userName: payloadUserName, startDate: data.startDate, endDate: data.endDate, totalDays, userDepartment: payloadUserDepartment }),
      });
      let created: VacationRequest | null = null;
      let apiSuccess = false;
      let apiErrorMessage: string | undefined = undefined;
      if (res.ok) {
        created = await res.json();
        apiSuccess = true;
      } else {
        // try to read error message from API
        try {
          const err = await res.json();
          apiErrorMessage = err?.error || (err && typeof err === 'string' ? String(err) : undefined);
        } catch (_) {
          apiErrorMessage = undefined;
        }
        // fallback local if API failed — mark as local-only so UI can avoid API calls later
        created = {
          ...data,
          id: `local-vac-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
          __localOnly: true,
          requestedAt: new Date().toISOString(),
          status: 'Aprovado',
          userName: user ? user.name : (data.userName || data.userId),
          userDepartment: user?.department || 'N/A',
          userAvatarUrl: user?.avatarUrl,
          totalDays,
        } as VacationRequest & { __localOnly?: boolean };
      }

      // Normalize created entry: fill missing user fields from local users list or from provided data
      const matchedFromCreated = created && created.userId ? allUsers.find(u => u.id === created!.userId) : undefined;
      const matchedByName = created && created.userName ? allUsers.find(u => u.name.toLowerCase() === created!.userName.toLowerCase()) : undefined;
      const resolvedUser = matchedFromCreated ?? matchedByName ?? user;

      // Treat empty strings as missing values: prefer non-empty API value, then resolvedUser, then provided data
      const apiUserName = (created as any).userName;
      const chosenUserName = (apiUserName && String(apiUserName).trim().length > 0)
        ? String(apiUserName)
        : (resolvedUser?.name ?? data.userName ?? data.userId);
      const apiUserDept = (created as any).userDepartment;
      const chosenUserDept = (apiUserDept && String(apiUserDept).trim().length > 0)
        ? String(apiUserDept)
        : (resolvedUser?.department ?? 'N/A');

      created = {
        ...(created as VacationRequest),
        id: (created as any).id ?? `vac-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
        requestedAt: (created as any).requestedAt ?? new Date().toISOString(),
        status: (created as any).status ?? 'Aprovado',
        userName: chosenUserName,
        userDepartment: chosenUserDept,
        userAvatarUrl: (created as any).userAvatarUrl ?? resolvedUser?.avatarUrl,
        totalDays: (created as any).totalDays ?? totalDays,
      } as VacationRequest;

      // If there's no userId (free-text), synthesize a local user id and inject a color rule
      if (!created.userId) {
        const syntheticId = `local-user-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        created.userId = syntheticId;
        // create a synthetic user entry so roadmap's `users` includes it
        const syntheticUser: User = {
          id: syntheticId,
          name: created.userName || `Usuário ${syntheticId}`,
          avatarUrl: created.userAvatarUrl,
          department: created.userDepartment || 'N/A',
        } as User;
        setExtraUsers(prev => [...prev, syntheticUser]);

        // pick a color for this synthetic user and inject CSS
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        const css = `
          .vac-user-dot-${syntheticId} { background-color: ${color} !important; }
          .vac-user-color-${syntheticId} { background-color: ${color} !important; }
        `;
        upsertRule(`user-color-${syntheticId}`, css);

        // make synthetic user visible by default so it appears on the calendar/roadmap
        setVisibleUsers(prev => {
          const next = new Set(prev);
          next.add(syntheticId);
          return next;
        });
      }

      setAllVacations(prev => [...prev, created!]);
      setIsFormOpen(false);
      const displayName = created.userName ?? resolvedUser?.name ?? data.userName ?? data.userId ?? 'colaborador';
      if (apiSuccess) {
        toast({ title: 'Férias Agendadas!', description: `As férias de ${displayName} foram agendadas com sucesso.` });
      } else {
        toast({
          title: 'Férias Agendadas (local)',
          description: `As férias de ${displayName} foram registradas localmente. Não foi possível persistir — ${apiErrorMessage ?? 'erro desconhecido'}`,
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error('create vacation error', e);
      const local: VacationRequest & { __localOnly?: boolean } = {
        ...data,
        id: `local-vac-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
        __localOnly: true,
        requestedAt: new Date().toISOString(),
        status: 'Aprovado',
        userName: user ? user.name : (data.userName || data.userId),
        userDepartment: user?.department || 'N/A',
        userAvatarUrl: user?.avatarUrl,
        totalDays,
      };
  setAllVacations(prev => [...prev, local]);
  setIsFormOpen(false);
  const displayName = user?.name ?? data.userName ?? data.userId ?? 'colaborador';
  toast({ title: 'Férias Agendadas (local)', description: `As férias de ${displayName} foram registradas localmente (não persistidas).` });
    }
  };

  const visibleCombinedUsers = useMemo(
    () => combinedUsers.filter(user => visibleUsers.has(user.id)),
    [combinedUsers, visibleUsers]
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cronograma de Férias Anual"
        description="Painel de visualização para o planejamento de férias da equipe."
      >
        <div className='flex items-center gap-2'>
            <Select value={String(displayYear)} onValueChange={(value) => setDisplayYear(Number(value))}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                    {yearOptions.map(year => (
                         <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2" />
                        Agendar Férias
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agendar Novas Férias</DialogTitle>
                    </DialogHeader>
                    <VacationForm 
                        users={allUsers}
                        onSubmit={handleAddVacation}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      
      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <div className="overflow-x-auto">
            <VacationRoadmap
              vacations={vacationsForYear}
              users={visibleCombinedUsers}
              userColors={userColors}
              displayYear={displayYear}
            />
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <VacationList 
        vacations={vacationsForYear}
        userColors={userColors}
        allUsers={combinedUsers}
        visibleUsers={visibleUsers}
        onUserVisibilityChange={handleUserVisibilityChange}
        onDelete={async (id: string) => {
          try {
            // If this is a local-only vacation (created when API failed), skip the API
            const localCandidate = allVacations.find(v => v.id === id) as (VacationRequest & { __localOnly?: boolean }) | undefined;
            if (localCandidate?.__localOnly || String(id).startsWith('local-vac-')) {
              console.debug('Removing local-only vacation, skipping API delete', { id });
              setAllVacations(prev => prev.filter(v => v.id !== id));
              toast({ title: 'Removido', description: 'Período de férias removido (local).' });
              return;
            }
            // Debug: log exact id and encoded value sent to the API
            console.debug('Deleting vacation - id', { id, encoded: encodeURIComponent(id) });
            const res = await fetch(`/api/vacations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!res.ok) {
              // Attempt to read JSON body for better diagnostics
              const body = await res.json().catch(() => ({}));
              console.debug('Delete response not ok', { status: res.status, body });
              // If the server reports the vacation was not found, it may be a local-only record
              // (e.g. created locally when the POST failed). In that case remove it locally
              // and surface a less alarming toast instead of throwing an error.
              if (res.status === 404 || (body && body.error && String(body.error).toLowerCase().includes('not found'))) {
                setAllVacations(prev => prev.filter(v => v.id !== id));
                toast({ title: 'Removido', description: 'Período de férias removido (registro local).' });
                return;
              }
              throw new Error(body?.error || `Failed to delete (status ${res.status})`);
            }
            setAllVacations(prev => prev.filter(v => v.id !== id));
            toast({ title: 'Removido', description: 'Período de férias removido.' });
          } catch (e) {
            console.error('delete vacation error', e);
            toast({ title: 'Erro', description: String(e), variant: 'destructive' });
          }
        }}
      />
      </div>
    </div>
  );
}
