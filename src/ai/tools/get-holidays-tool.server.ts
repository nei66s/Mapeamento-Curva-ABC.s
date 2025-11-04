"use server";
import { getAi } from '@/ai/genkit';
import { z } from 'genkit';

// A simple list of Brazilian national holidays for demonstration purposes.
// In a real-world scenario, this would come from an API or a more comprehensive library.
const holidaysByMonth: Record<number, { day: number; name: string }[]> = {
  0: [{ day: 1, name: 'Confraternização Universal' }], // January
  3: [{ day: 21, name: 'Tiradentes' }], // April
  4: [{ day: 1, name: 'Dia do Trabalho' }], // May
  8: [{ day: 7, name: 'Independência do Brasil' }], // September
  9: [{ day: 12, name: 'Nossa Senhora Aparecida' }], // October
  10: [{ day: 2, name: 'Finados' }, { day: 15, name: 'Proclamação da República' }], // November
  11: [{ day: 25, name: 'Natal' }], // December
};

export type Holiday = { date: string; name: string };

export async function runGetHolidays(year: number, month: number): Promise<Holiday[]> {
  const monthIndex = month - 1;
  const holidays = holidaysByMonth[monthIndex] || [];
  return holidays.map(holiday => ({
    date: `${year}-${String(month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
    name: holiday.name,
  }));
}

export function getHolidaysTool() {
  // If a Genkit tool object is required, construct it lazily here using getAi.
  // Many flows won't need this; they can call runGetHolidays directly.
  return {
    name: 'getHolidaysTool',
    description: 'Returns a list of holidays for a given year and month in Brazil.',
    run: runGetHolidays,
  } as const;
}
