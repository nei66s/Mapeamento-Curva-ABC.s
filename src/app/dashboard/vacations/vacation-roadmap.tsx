 'use client';
import { useMemo } from 'react';
import type { VacationRequest, User } from '@/lib/types';
import { getDayOfYear, getDaysInYear, parseISO, format, getYear, eachDayOfInterval, areIntervalsOverlapping } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect } from 'react';
import { upsertRule, removeRule } from '@/lib/dynamic-styles';

interface VacationRoadmapProps {
  vacations: VacationRequest[];
  users: User[];
  userColors: Record<string, string>;
  displayYear: number;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'MMM', { locale: ptBR }));
const WEEKS = ['S1', 'S2', 'S3', 'S4'];

export function VacationRoadmap({ vacations, users, userColors, displayYear }: VacationRoadmapProps) {
  const daysInYear = getDaysInYear(new Date(displayYear, 0, 1));
  const isCurrentYear = getYear(new Date()) === displayYear;

  const todayPosition = useMemo(() => {
    if (!isCurrentYear) return null;
    const day = getDayOfYear(new Date());
    return `${(day / daysInYear) * 100}%`;
  }, [daysInYear, isCurrentYear]);
  
  const monthBoundaries = useMemo(() => {
    return MONTHS.map((_, i) => {
        const start = new Date(displayYear, i, 1);
        const end = new Date(displayYear, i + 1, 0);
        const startDay = getDayOfYear(start);
        const endDay = getDayOfYear(end);
        const width = ((endDay - startDay + 1) / daysInYear) * 100;
        return { width };
    });
  }, [displayYear, daysInYear]);


  const vacationData = useMemo(() => {
    const processedData = users.map(user => {
      const userVacations = vacations
        .filter(v => v.userId === user.id && v.status === 'Aprovado')
        .map(v => {
            const start = parseISO(v.startDate);
            const end = parseISO(v.endDate);
            const yearStart = new Date(displayYear, 0, 1);
            const yearEnd = new Date(displayYear, 11, 31, 23, 59, 59);
            const effectiveStart = start < yearStart ? yearStart : start;
            const effectiveEnd = end > yearEnd ? yearEnd : end;

            const startDay = getDayOfYear(effectiveStart);
            const endDay = getDayOfYear(effectiveEnd);

            const left = ((startDay - 1) / daysInYear) * 100;
            const width = ((endDay - startDay + 1) / daysInYear) * 100;
            
            return {
                ...v,
                left: `${left}%`,
                width: `${width}%`,
                interval: { start: effectiveStart, end: effectiveEnd },
                lane: 0,
            };
        });

      // Simple lane logic for this user
      userVacations.sort((a,b) => a.interval.start.getTime() - b.interval.start.getTime());
      const lanes: {end: Date}[] = [];
      userVacations.forEach(vacation => {
          let placed = false;
          for (let i = 0; i < lanes.length; i++) {
              if (vacation.interval.start > lanes[i].end) {
                  vacation.lane = i;
                  lanes[i].end = vacation.interval.end;
                  placed = true;
                  break;
              }
          }
          if (!placed) {
              vacation.lane = lanes.length;
              lanes.push({end: vacation.interval.end});
          }
      });

      return { user, vacations: userVacations };
    });

    const allSegments = processedData.flatMap(d => d.vacations);
    
    const segmentsWithConflict = new Set<string>();
    for (let i = 0; i < allSegments.length; i++) {
        for (let j = i + 1; j < allSegments.length; j++) {
            if (areIntervalsOverlapping(allSegments[i].interval, allSegments[j].interval)) {
                segmentsWithConflict.add(allSegments[i].id);
                segmentsWithConflict.add(allSegments[j].id);
            }
        }
    }
    
    return processedData.map(data => ({
        ...data,
        vacations: data.vacations.map(v => ({
            ...v,
            hasConflict: segmentsWithConflict.has(v.id),
        }))
    }));

  }, [users, vacations, daysInYear, displayYear]);

    // Inject dynamic CSS for month widths, today line and segments
    useEffect(() => {
        // month widths
        monthBoundaries.forEach((m, i) => {
            const className = `vac-month-${displayYear}-${i}`;
            upsertRule(className, `.${className} { width: ${m.width}%; }`);
        });

        // today line
        if (todayPosition) {
            upsertRule(`vac-today-line-${displayYear}`, `.vac-today-line { left: ${todayPosition}; }`);
        }

        // segments
        vacationData.forEach(({ vacations }) => {
            vacations.forEach(seg => {
                const cls = `vac-seg-${seg.id}`;
                const bg = seg.hasConflict ? 'hsl(var(--destructive))' : userColors[seg.userId || seg.userId];
                upsertRule(cls, `.${cls} { left: ${seg.left}; width: ${seg.width}; top: ${seg.lane * 28 + 4}px; background: ${bg}; min-width: 2px; border: 2px solid var(--background); }`);
            });
        });

        return () => {
            monthBoundaries.forEach((_, i) => removeRule(`vac-month-${displayYear}-${i}`));
            removeRule(`vac-today-line-${displayYear}`);
            vacationData.forEach(({ vacations }) => vacations.forEach(seg => removeRule(`vac-seg-${seg.id}`)));
        };
    }, [monthBoundaries, vacationData, todayPosition, userColors, displayYear]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roadmap de Férias</CardTitle>
        <CardDescription>Linha do tempo das férias da equipe para {displayYear}.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2 pr-6">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-[10rem_1fr]">
              {/* Headers */}
              <div/>
              <div className="relative border-b pb-1">
                  <div className="flex text-center text-xs font-semibold text-muted-foreground">
                      {monthBoundaries.map((month, i) => (
                          <div key={i} className={`vac-month-${displayYear}-${i}`}>{MONTHS[i].toUpperCase()}</div>
                      ))}
                  </div>
                  <div className="flex text-center text-xs font-semibold text-muted-foreground/70 mt-1">
                      {monthBoundaries.map((month, i) => (
                          <div key={`weeks-${i}`} className={`vac-month-${displayYear}-${i} flex justify-around`}>
                              {WEEKS.map(week => (
                                  <span key={week} className="flex-1">{week}</span>
                              ))}
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-[10rem_1fr]">
              {/* User Column */}
              <div>
                  {vacationData.map(({ user }) => (
                      <div key={user.id} className="flex items-center gap-2 shrink-0 h-10 py-1 pr-2 border-b">
                          <Avatar className="h-8 w-8">
                              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar"/>}
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{user.name}</span>
                      </div>
                  ))}
              </div>
              
              {/* Timeline Column */}
              <div className="relative">
                  {/* Background Grid */}
                  <div className="absolute top-0 left-0 h-full w-full flex z-0">
                      {monthBoundaries.map((month, i) => (
                          <div key={`bg-month-${i}`} className={`vac-month-${displayYear}-${i} h-full`}>
                            <div className='flex h-full'>
                                  <div className='w-1/4 border-r border-border/40 h-full'></div>
                                  <div className='w-1/4 border-r border-border/40 h-full'></div>
                                  <div className='w-1/4 border-r border-border/40 h-full'></div>
                                  <div className={`w-1/4 h-full ${i < 11 ? 'border-r border-border/50' : ''}`}></div>
                            </div>
                          </div>
                      ))}
                  </div>

                  {isCurrentYear && todayPosition && (
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 vac-today-line"></div>
                              </TooltipTrigger>
                              <TooltipContent><p>Hoje</p></TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  )}

                  {/* Vacation Bars */}
                  <TooltipProvider>
                      <div className="z-10 relative">
                          {vacationData.map(({ user, vacations }) => (
                              <div key={user.id} className="relative h-10 py-1 border-b">
                                  {vacations.map(segment => {
                                  return (
                                  <Tooltip key={segment.id}>
                                      <TooltipTrigger asChild>
                                      <div
                                          className={`absolute h-6 rounded-full cursor-pointer hover:opacity-80 border-2 border-background vac-seg-${segment.id}`}
                                      />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                      <p className="font-semibold">{user.name}</p>
                                      <p>{format(parseISO(segment.startDate), 'dd/MM/yyyy')} - {format(parseISO(segment.endDate), 'dd/MM/yyyy')}</p>
                                      {segment.hasConflict && <p className="text-destructive font-bold mt-1">Conflito de agendamento!</p>}
                                      </TooltipContent>
                                  </Tooltip>
                                  )})}
                              </div>
                          ))}
                      </div>
                  </TooltipProvider>
              </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
