
"use server";
import { z } from 'zod';

// Keep schemas here (zod is safe to import) but delegate heavy Genkit work
// to a server-only implementation loaded dynamically.
export const KpiSummaryInputSchema = z.object({
  mes: z.string().describe('The month being analyzed (format YYYY-MM).'),
  sla_mensal: z.number().describe('The SLA achieved in the month (%).'),
  meta_sla: z.number().describe('The target SLA for the month (%).'),
  crescimento_mensal_sla: z.number().describe('The percentage growth of the SLA compared to the previous month.'),
  chamados_abertos: z.number().describe('Number of new tickets opened.'),
  chamados_solucionados: z.number().describe('Number of tickets resolved.'),
  backlog: z.number().describe('Number of pending tickets at the end of the month.'),
});

export type KpiSummaryInput = z.infer<typeof KpiSummaryInputSchema>;

export const KpiSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise executive summary of the monthly performance, highlighting positive points, points of attention, and key trends.'),
});
export type KpiSummaryOutput = z.infer<typeof KpiSummaryOutputSchema>;

export async function summarizeKpi(input: KpiSummaryInput): Promise<KpiSummaryOutput> {
  const impl = await import('./summarize-kpi-flow.server');
  return impl.runSummarizeKpi(input);
}
