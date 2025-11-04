
'use server';

/**
 * @fileOverview Defines a Genkit tool to retrieve a list of holidays for a given year and month.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// A simple list of Brazilian national holidays for demonstration purposes.
// In a real-world scenario, this would come from an API or a more comprehensive library.
const holidaysByMonth: Record<number, { day: number; name: string }[]> = {
  0: [{ day: 1, name: 'Confraternização Universal' }], // January
  3: [
    { day: 21, name: 'Tiradentes' },
  ], // April
  4: [{ day: 1, name: 'Dia do Trabalho' }], // May
  8: [{ day: 7, name: 'Independência do Brasil' }], // September
  9: [{ day: 12, name: 'Nossa Senhora Aparecida' }], // October
  10: [
    { day: 2, name: 'Finados' },
    { day: 15, name: 'Proclamação da República' },
  ], // November
  11: [{ day: 25, name: 'Natal' }], // December
};

export const getHolidaysTool = ai.defineTool(
  {
    name: 'getHolidaysTool',
    description: 'Returns a list of holidays for a given year and month in Brazil.',
    inputSchema: z.object({
      year: z.number().describe('The year to get holidays for.'),
      month: z.number().describe('The month to get holidays for (1-12).'),
    }),
    outputSchema: z.array(z.object({
        date: z.string().describe('The date of the holiday in YYYY-MM-DD format.'),
        name: z.string().describe('The name of the holiday.'),
    })),
  },
  async ({ year, month }) => {
    // month is 1-12, but our object is 0-indexed
    const monthIndex = month - 1;
    const holidays = holidaysByMonth[monthIndex] || [];
    
    return holidays.map(holiday => ({
        date: `${year}-${String(month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
        name: holiday.name,
    }));
  }
);

    