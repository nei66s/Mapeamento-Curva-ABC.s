
'use server';
/**
 * @fileOverview Provides an AI-powered summary of monthly maintenance KPIs.
 *
 * - summarizeKpi - A function that retrieves the KPI summary.
 * - KpiSummaryInput - The input type for the summarizeKpi function.
 * - KpiSummaryOutput - The return type for the summarizeKpi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// We can't directly import the type from lib/types because it's client-side.
// So we redefine the necessary parts of the schema for the AI flow.
const KpiSummaryInputSchema = z.object({
  mes: z.string().describe('The month being analyzed (format YYYY-MM).'),
  sla_mensal: z.number().describe('The SLA achieved in the month (%).'),
  meta_sla: z.number().describe('The target SLA for the month (%).'),
  crescimento_mensal_sla: z.number().describe('The percentage growth of the SLA compared to the previous month.'),
  chamados_abertos: z.number().describe('Number of new tickets opened.'),
  chamados_solucionados: z.number().describe('Number of tickets resolved.'),
  backlog: z.number().describe('Number of pending tickets at the end of the month.'),
});

export type KpiSummaryInput = z.infer<typeof KpiSummaryInputSchema>;

const KpiSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise executive summary of the monthly performance, highlighting positive points, points of attention, and key trends.'),
});
export type KpiSummaryOutput = z.infer<typeof KpiSummaryOutputSchema>;

export async function summarizeKpi(input: KpiSummaryInput): Promise<KpiSummaryOutput> {
  return kpiSummaryFlow(input);
}

const kpiSummaryPrompt = ai.definePrompt({
  name: 'kpiSummaryPrompt',
  input: {schema: KpiSummaryInputSchema},
  output: {schema: KpiSummaryOutputSchema},
  prompt: `You are a senior maintenance manager analyzing monthly performance indicators (KPIs).
  Your task is to provide a concise executive summary for the month of {{{mes}}}.
  
  The summary should be written in Portuguese and must highlight:
  1.  **Positive Points:** What went well? Did we exceed any goals?
  2.  **Points of Attention:** What are the concerns? Where did we miss the mark? What are the risks?
  3.  **Key Trends:** How does this month compare to the previous one (based on the growth/variation fields)?
  
  Be objective and data-driven. Use the provided KPIs to justify your analysis.
  
  **KPIs for the month: {{{mes}}}**
  - SLA Mensal: {{{sla_mensal}}}% (Meta: {{{meta_sla}}}%)
  - Crescimento SLA vs. Mês Anterior: {{{crescimento_mensal_sla}}}%
  - Chamados Abertos: {{{chamados_abertos}}}
  - Chamados Solucionados: {{{chamados_solucionados}}}
  - Saldo de Backlog: {{{backlog}}}

  Generate the summary below.
  `,
});

const kpiSummaryFlow = ai.defineFlow(
  {
    name: 'kpiSummaryFlow',
    inputSchema: KpiSummaryInputSchema,
    outputSchema: KpiSummaryOutputSchema,
  },
  async input => {
    const {output} = await kpiSummaryPrompt(input);
    return output!;
  }
);
