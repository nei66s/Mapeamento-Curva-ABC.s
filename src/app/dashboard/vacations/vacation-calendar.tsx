'use client';

import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { VacationRequest } from '@/lib/types';
import {
  parseISO,
  eachDayOfInterval,
  format,
  startOfYear,
  startOfMonth,
  endOfMonth,
  addDays,
  isWeekend,
  getYear,
  isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo, useEffect } from 'react';
import { DayPicker, Day, type DayProps, type FooterProps } from 'react-day-picker';
import { upsertRule, removeRule } from '@/lib/dynamic-styles';
import { AlertCircle, Star } from 'lucide-react';

interface VacationCalendarProps {
  vacations: VacationRequest[];
  userColors: Record<string, string>;
  visibleUsers: Set<string>;
  displayYear: number;
  holidays: Date[];
}

function getNextBusinessDay(date: Date, holidays: Date[]): Date {
  let nextDay = addDays(date, 1);
  while (
    isWeekend(nextDay) ||
    holidays.some(h => isSameDay(h, nextDay))
  ) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

const createStripedBackground = (colors: string[]) => {
  if (colors.length === 1) {
    return colors[0];
  }
  const colorStops = colors.map((color, index) => {
    const start = index * 10;
    const end = start + 10;
    return `${color} ${start}px, ${color} ${end}px`;
  }).join(', ');

  return `repeating-linear-gradient(45deg, ${colorStops})`;
};


export function VacationCalendar({
  vacations,
  userColors,
  visibleUsers,
  displayYear,
  holidays,
}: VacationCalendarProps) {
  // react-day-picker Day types are strict; cast to any to apply runtime className/children
  const DayComponent: any = Day as unknown as any;
  const { vacationsByDay, returnDaysWithUser } = useMemo(() => {
    const dailyVacations: Record<string, VacationRequest[]> = {};
    const returnDays: { date: Date; userId: string, userName: string }[] = [];

    vacations.forEach(v => {
      // include vacations for visible users or for local synthetic users (prefix 'local-user-')
      const isSynthetic = v.userId && String(v.userId).startsWith('local-user-');
      if ((isSynthetic || visibleUsers.has(v.userId)) && v.status === 'Aprovado') {
        const startDate = parseISO(v.startDate);
        const endDate = parseISO(v.endDate);

         const yearStart = new Date(displayYear, 0, 1);
         const yearEnd = new Date(displayYear, 11, 31);
         const effectiveStart = startDate > yearStart ? startDate : yearStart;
         const effectiveEnd = endDate < yearEnd ? endDate : yearEnd;

        if (effectiveStart > effectiveEnd) return;

        const interval = eachDayOfInterval({
          start: effectiveStart,
          end: effectiveEnd,
        });

        interval.forEach(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          if (!dailyVacations[dayStr]) {
            dailyVacations[dayStr] = [];
          }
          dailyVacations[dayStr].push(v);
        });

        const returnDay = getNextBusinessDay(endDate, holidays);
          if (getYear(returnDay) === displayYear) {
          returnDays.push({ date: returnDay, userId: v.userId, userName: v.userName });
        }
      }
    });

    return {
      vacationsByDay: dailyVacations,
      returnDaysWithUser: returnDays,
    };
  }, [vacations, visibleUsers, holidays, displayYear]);

  const defaultMonth = useMemo(() => startOfYear(new Date(displayYear, 0, 1)), [displayYear]);

  // ensure per-day CSS rules (background/border) are injected instead of inline styles
  useEffect(() => {
    // build rules for days present in vacationsByDay and returnDaysWithUser
    Object.keys(vacationsByDay).forEach(dayStr => {
      const dayVacations = vacationsByDay[dayStr] || [];
      if (dayVacations.length === 0) return;
      const colors = dayVacations.map(v => userColors[v.userId]);
      const bg = createStripedBackground(colors);
      const ruleId = `vac-day-${dayStr}`;
      const isReturn = returnDaysWithUser.some(rd => format(rd.date, 'yyyy-MM-dd') === dayStr);
      const borderCss = isReturn ? 'border: 2px solid hsl(var(--foreground));' : '';
      const css = `.${ruleId} { background: ${bg}; color: hsl(var(--primary-foreground)); font-weight: bold; ${borderCss} }`;
      upsertRule(ruleId, css);
    });

    return () => {
      Object.keys(vacationsByDay).forEach(dayStr => removeRule(`vac-day-${dayStr}`));
    };
  }, [vacationsByDay, userColors, returnDaysWithUser]);

  function CustomDay(props: DayProps) {
    const dayStr = format(props.date, 'yyyy-MM-dd');
    const dayVacations = vacationsByDay[dayStr] || [];
    const returnDayInfo = returnDaysWithUser.find(rd => isSameDay(rd.date, props.date));
    const isReturnDay = !!returnDayInfo;

    const dayClass = `vac-day-${dayStr}`;
    // compute inline background as a fallback in case dynamic CSS rules are not applied
    const colors = dayVacations.map(v => userColors[v.userId]).filter(Boolean) as string[];
    const bg = colors.length > 0 ? createStripedBackground(colors) : undefined;

    const dayContent = (
       <>
        {props.date.getDate()}
        {isReturnDay && (
            <Star className="absolute h-3 w-3 top-0.5 right-0.5 text-amber-400 fill-amber-400 drop-shadow-md"/>
        )}
      </>
    );
    
  const renderTooltipContent = () => {
    const vacationUsers = dayVacations.map(v => (
       <div key={v.id} className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full vac-user-dot-${v.userId}`} />
        <span>{v.userName} (Férias)</span>
      </div>
    ));

        const returnUsers = returnDaysWithUser
            .filter(rd => isSameDay(rd.date, props.date))
            .map(rd => (
                 <div key={`return-${rd.userId}`} className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-amber-400"/>
                    <span>Retorno de {rd.userName}</span>
                </div>
            ));

        return <div className="flex flex-col gap-1.5">{returnUsers}{vacationUsers}</div>;
    }

    if (dayVacations.length > 0 || isReturnDay) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
                <DayComponent
                  {...(props as any)}
                  className={`${(props as any).className ?? ''} ${dayVacations.length > 0 ? dayClass : ''}`}
                  style={{
                    ...((props as any).style ?? {}),
                    ...(dayVacations.length > 0 && bg ? { background: bg, color: 'hsl(var(--primary-foreground))', fontWeight: 600 } : {}),
                    ...(isReturnDay ? { border: '2px solid hsl(var(--foreground))' } : {}),
                  }}
                >
                  {dayContent}
                </DayComponent>
            </TooltipTrigger>
            <TooltipContent>
              {renderTooltipContent()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <DayComponent {...(props as any)}>{props.date.getDate()}</DayComponent>;
  }
  function MonthFooter(props: FooterProps) {
    const displayMonth: Date | undefined = props.displayMonth;
    if (!displayMonth) return null;

    const { monthUsers, hasConflict } = useMemo(() => {
  const users = new Map<string, { id: string; name: string; color: string }>();
      let conflict = false;
      const monthStart = startOfMonth(displayMonth);
      const monthEnd = endOfMonth(displayMonth);

      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

      daysInMonth.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daily = vacationsByDay[dayStr];
        if (daily && daily.length > 1) {
          conflict = true;
        }
      });

          vacations.forEach(v => {
        const isSynthetic = v.userId && String(v.userId).startsWith('local-user-');
        if (isSynthetic || visibleUsers.has(v.userId)) {
          const vacationStart = parseISO(v.startDate);
          const vacationEnd = parseISO(v.endDate);

          if (vacationStart <= monthEnd && vacationEnd >= monthStart) {
            if (!users.has(v.userId)) {
              users.set(v.userId, { id: v.userId, name: v.userName, color: userColors[v.userId] });
            }
          }
        }
      });
      return { monthUsers: Array.from(users.values()), hasConflict: conflict };
    }, [displayMonth, visibleUsers, vacations, userColors, vacationsByDay]);

    if (monthUsers.length === 0 && !hasConflict) {
      return null;
    }

    return (
      <tfoot>
        <tr>
          <td colSpan={7}>
            <div className="mt-2 border-t pt-2 px-2">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Legenda do Mês:</h4>
              <div className="space-y-1">
                {monthUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full vac-user-dot-${user.id}`} />
                    <span className="text-xs">{user.name}</span>
                  </div>
                ))}
              </div>
              {hasConflict && (
                <div className="flex items-center gap-2 mt-2 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs font-semibold">Conflito de agenda</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      </tfoot>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-1">
      <DayPicker
        locale={ptBR}
        className="rounded-md border w-full"
        numberOfMonths={12}
        fromYear={displayYear}
        toYear={displayYear}
        defaultMonth={defaultMonth}
        components={{ Day: CustomDay, Footer: MonthFooter }}
        classNames={{
          months: 'flex flex-wrap -mx-2 justify-center',
          month:
            'p-4 space-y-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/4 2xl:w-1/6 border rounded-md m-2',
          caption: 'flex justify-center pt-1 relative items-center',
          caption_label: 'text-sm font-medium',
          nav: 'space-x-1 flex items-center',
          nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          nav_button_previous: 'absolute left-1',
          nav_button_next: 'absolute right-1',
          table: 'w-full border-collapse space-y-1',
          head_row: 'flex',
          head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
          row: 'flex w-full mt-2',
          cell:
            'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
          day:
            'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent focus:bg-accent focus:text-accent-foreground flex items-center justify-center',
          day_selected:
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
          day_today: 'bg-accent text-accent-foreground',
          day_disabled: 'text-muted-foreground opacity-50',
          day_hidden: 'invisible',
        }}
      />
    </div>
  );
}
