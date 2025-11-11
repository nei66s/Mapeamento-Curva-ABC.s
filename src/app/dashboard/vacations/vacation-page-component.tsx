'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { VacationCalendar } from './vacation-calendar';
import { VacationList } from './vacation-list';
import type { VacationRequest, User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getYear, isWeekend, parseISO, isSameDay, eachDayOfInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { VacationForm } from './vacation-form';
import { useToast } from '@/hooks/use-toast';
import { upsertRule, removeRule } from '@/lib/dynamic-styles';
import { runGetHolidays } from '@/ai/tools/get-holidays-tool';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [visibleUsers, setVisibleUsers] = useState<Set<string>>(() => new Set(allUsers.map(u => u.id)));
  const [extraUsers, setExtraUsers] = useState<User[]>([]);
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [holidays, setHolidays] = useState<Date[]>([]);
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
    async function fetchHolidaysAndCalculateDays() {
        setLoading(true);
        try {
            const allMonths = Array.from({length: 12}, (_, i) => i + 1);
            const holidayPromises = allMonths.map(month => runGetHolidays(displayYear, month));
            const holidaysByMonth = await Promise.all(holidayPromises);
            const holidayDates = holidaysByMonth.flat().map(h => parseISO(h.date));
            setHolidays(holidayDates);

            const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
                let count = 0;
                const interval = eachDayOfInterval({ start: startDate, end: endDate });
                for (const day of interval) {
                    const isHoliday = holidayDates.some(h => isSameDay(h, day));
                    if (!isWeekend(day) && !isHoliday) {
                        count++;
                    }
                }
                return count;
            };

            const updatedVacations = initialVacations.map(vacation => ({
                ...vacation,
                totalDays: calculateBusinessDays(parseISO(vacation.startDate), parseISO(vacation.endDate)),
            }));
            setAllVacations(updatedVacations);
        } catch (e) {
            console.error("Could not fetch holidays, proceeding without them.", e);
            toast({
                variant: 'destructive',
                title: 'Erro ao buscar feriados',
                description: 'A contagem de dias úteis pode estar incorreta.'
            });
            // Continue with calculation without holidays
            const updatedVacations = initialVacations.map(vacation => ({
                ...vacation,
                totalDays: eachDayOfInterval({ start: parseISO(vacation.startDate), end: parseISO(vacation.endDate) }).filter(day => !isWeekend(day)).length,
            }));
            setAllVacations(updatedVacations);
        } finally {
            setLoading(false);
        }
    }
    fetchHolidaysAndCalculateDays();
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
  
  const handleAddVacation = async (data: Omit<VacationRequest, 'id' | 'requestedAt' | 'status' | 'userName' | 'userDepartment' | 'userAvatarUrl' | 'totalDays'> & { userName?: string }) => {
    // Try to resolve user by id first, then by provided userName
    let user = allUsers.find(u => u.id === data.userId);
    if (!user && data.userName) {
      user = allUsers.find(u => u.name.toLowerCase() === data.userName!.toLowerCase());
    }
    
    let totalDays = 0;
    try {
         totalDays = eachDayOfInterval({ start: parseISO(data.startDate), end: parseISO(data.endDate) })
            .filter(day => !isWeekend(day) && !holidays.some(h => isSameDay(h, day))).length;
    } catch(e) {
        console.error("Error calculating business days on add:", e);
        totalDays = eachDayOfInterval({ start: parseISO(data.startDate), end: parseISO(data.endDate) }).filter(day => !isWeekend(day)).length;
    }


    try {
      const res = await fetch('/api/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.userId, startDate: data.startDate, endDate: data.endDate, totalDays }),
      });
      let created: VacationRequest | null = null;
      if (res.ok) {
        created = await res.json();
      } else {
        // fallback local if API falhar
        created = {
          ...data,
          id: `vac-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
          requestedAt: new Date().toISOString(),
          status: 'Aprovado',
          userName: user ? user.name : (data.userName || data.userId),
          userDepartment: user?.department || 'N/A',
          userAvatarUrl: user?.avatarUrl,
          totalDays,
        } as VacationRequest;
      }

      // Normalize created entry: fill missing user fields from local users list or from provided data
      const matchedFromCreated = created && created.userId ? allUsers.find(u => u.id === created!.userId) : undefined;
      const matchedByName = created && created.userName ? allUsers.find(u => u.name.toLowerCase() === created!.userName.toLowerCase()) : undefined;
      const resolvedUser = matchedFromCreated ?? matchedByName ?? user;

      created = {
        ...(created as VacationRequest),
        id: (created as any).id ?? `vac-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
        requestedAt: (created as any).requestedAt ?? new Date().toISOString(),
        status: (created as any).status ?? 'Aprovado',
        userName: (created as any).userName ?? resolvedUser?.name ?? data.userName ?? data.userId,
        userDepartment: (created as any).userDepartment ?? resolvedUser?.department ?? 'N/A',
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
      toast({ title: 'Férias Agendadas!', description: `As férias de ${displayName} foram agendadas com sucesso.` });
    } catch (e) {
      console.error('create vacation error', e);
      const local: VacationRequest = {
        ...data,
        id: `vac-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,
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
      
      <Tabs defaultValue="roadmap" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roadmap">Visão de Roadmap</TabsTrigger>
            <TabsTrigger value="calendar">Visão de Calendário</TabsTrigger>
        </TabsList>
        <TabsContent value="roadmap" className="mt-6">
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
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
             {loading ? (
                <Skeleton className="h-[600px] w-full" />
            ) : (
                <div className="w-full overflow-x-auto">
                    <VacationCalendar 
                        vacations={vacationsForYear}
                        userColors={userColors}
                        visibleUsers={visibleUsers}
                        displayYear={displayYear}
                        holidays={holidays}
                    />
                </div>
            )}
        </TabsContent>
      </Tabs>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
    <VacationList 
      vacations={vacationsForYear}
      userColors={userColors}
      allUsers={combinedUsers}
      visibleUsers={visibleUsers}
      onUserVisibilityChange={handleUserVisibilityChange}
    />
      </div>
    </div>
  );
}
