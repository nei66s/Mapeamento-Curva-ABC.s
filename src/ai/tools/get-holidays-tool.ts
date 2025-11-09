"use server";
/**
 * Lightweight wrapper for the holidays utility. We provide a simple
 * server-side implementation and export a function that can be called from
 * server actions. If you need the full Genkit tool object, use
 * `getHolidaysTool()` from the server implementation.
 */

export type Holiday = { date: string; name: string };

export async function runGetHolidays(year: number, month: number): Promise<Holiday[]> {
  const impl = await import('./get-holidays-tool.server');
  return impl.runGetHolidays(year, month);
}

export async function getHolidaysTool() {
  const impl = await import('./get-holidays-tool.server');
  return impl.getHolidaysTool;
}
