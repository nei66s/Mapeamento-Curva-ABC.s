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
  const [displayYear, setDisplayYear] = useState<number>(new Date().getFullYear());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const userColors = useMemo(() => {
    const colors: Record<string, string> = {};
    allUsers.forEach((user, index) => {
      colors[user.id] = colorPalette[index % colorPalette.length];
    });
    return colors;
  }, [allUsers]);

  // Inject CSS classes for each user color (used by child components)
  useEffect(() => {
    allUsers.forEach(u => {
      const id = `user-color-${u.id}`;
      const css = `
        .vac-user-dot-${u.id} { background-color: ${userColors[u.id]} !important; }
        .vac-user-color-${u.id} { background-color: ${userColors[u.id]} !important; }
      `;
      upsertRule(id, css);
    });

    return () => {
      allUsers.forEach(u => removeRule(`user-color-${u.id}`));
    };
  }, [allUsers, userColors]);
  
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


  const vacationsForYear = useMemo(() => {
    return allVacations.filter(v => getYear(new Date(v.startDate)) === displayYear || getYear(new Date(v.endDate)) === displayYear);
  }, [allVacations, displayYear]);

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
  
  const handleAddVacation = async (data: Omit<VacationRequest, 'id' | 'requestedAt' | 'status' | 'userName' | 'userDepartment' | 'userAvatarUrl' | 'totalDays'>) => {
    const user = allUsers.find(u => u.id === data.userId);
    if (!user) return;
    
    let totalDays = 0;
    try {
         totalDays = eachDayOfInterval({ start: parseISO(data.startDate), end: parseISO(data.endDate) })
            .filter(day => !isWeekend(day) && !holidays.some(h => isSameDay(h, day))).length;
    } catch(e) {
        console.error("Error calculating business days on add:", e);
        totalDays = eachDayOfInterval({ start: parseISO(data.startDate), end: parseISO(data.endDate) }).filter(day => !isWeekend(day)).length;
    }


    const newVacation: VacationRequest = {
        ...data,
        id: `vac-${Date.now()}`,
        requestedAt: new Date().toISOString(),
        status: 'Aprovado',
        userName: user.name,
        userDepartment: user.department || 'N/A',
        userAvatarUrl: user.avatarUrl,
        totalDays: totalDays,
    };
    
    setAllVacations(prev => [...prev, newVacation]);
    setIsFormOpen(false);
    toast({
        title: 'Férias Agendadas!',
        description: `As férias de ${user.name} foram agendadas com sucesso.`
    });
  };

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
                        users={allUsers.filter(u => visibleUsers.has(u.id))}
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
            allUsers={allUsers}
            visibleUsers={visibleUsers}
            onUserVisibilityChange={handleUserVisibilityChange}
        />
      </div>
    </div>
  );
}
