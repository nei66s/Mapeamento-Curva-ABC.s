"use server";
import { getAi } from '@/ai/genkit';
import { z } from 'zod';

export type KpiSummaryInput = {
  mes: string;
  sla_mensal: number;
  meta_sla: number;
  crescimento_mensal_sla: number;
  chamados_abertos: number;
  chamados_solucionados: number;
  backlog: number;
};

export type KpiSummaryOutput = { summary: string };

async function buildFlow() {
  const ai = await getAi();

  const KpiSummaryInputSchema = z.object({
    mes: z.string().describe('The month being analyzed (format YYYY-MM).'),
    sla_mensal: z.number().describe('The SLA achieved in the month (%).'),
    meta_sla: z.number().describe('The target SLA for the month (%).'),
    crescimento_mensal_sla: z.number().describe('The percentage growth of the SLA compared to the previous month.'),
    chamados_abertos: z.number().describe('Number of new tickets opened.'),
    chamados_solucionados: z.number().describe('Number of tickets resolved.'),
    backlog: z.number().describe('Number of pending tickets at the end of the month.'),
  });

  const KpiSummaryOutputSchema = z.object({
    summary: z.string().describe('A concise executive summary of the monthly performance, highlighting positive points, points of attention, and key trends.'),
  });

  const kpiSummaryPrompt = ai.definePrompt({
    name: 'kpiSummaryPrompt',
    input: { schema: KpiSummaryInputSchema },
    output: { schema: KpiSummaryOutputSchema },
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
    async (input: KpiSummaryInput) => {
      try {
        const { callWithRetries } = await import('@/ai/callWithRetries');
        const { output } = await callWithRetries(() => kpiSummaryPrompt(input as any), 3, 300);
        return output!;
      } catch (err: any) {
        console.error('Error running kpiSummaryPrompt:', err);
        // If the error indicates missing AI credentials, return a graceful
        // fallback so the client receives a normal response instead of
        // a generic "Failed to fetch" (which happens when server actions
        // throw). This keeps the UI usable in local/dev environments
        // where the GEMINI_API_KEY/GOOGLE_API_KEY may not be set.
        const msg = String(err?.message ?? '').toLowerCase();
        const isMissingKey = msg.includes('please pass in the api key') || msg.includes('gemini_api_key') || msg.includes('google_api_key') || err?.status === 'FAILED_PRECONDITION';
        if (isMissingKey) {
          return {
            summary: 'Análise de IA indisponível: credenciais do provedor de IA (GEMINI_API_KEY / GOOGLE_API_KEY) não configuradas no servidor. Defina as variáveis de ambiente para habilitar esta funcionalidade.'
          };
        }

        // For other errors, rethrow a friendlier message so callers can
        // still surface a readable error in the UI.
        // Include status/code when available to help debugging transient provider errors.
        const statusInfo = err?.status || err?.statusCode || err?.code ? ` [status=${err?.status ?? err?.statusCode ?? err?.code}]` : '';
        throw new Error('Falha ao rodar análise de IA. Verifique as credenciais e veja os logs do servidor para detalhes. ' + (err?.message ?? '') + statusInfo);
      }
    }
  );

  return { run: async (input: KpiSummaryInput) => kpiSummaryFlow(input as any) };
}

let _flow: { run: (input: KpiSummaryInput) => Promise<KpiSummaryOutput> } | null = null;

export async function runSummarizeKpi(input: KpiSummaryInput): Promise<KpiSummaryOutput> {
  if (!_flow) _flow = await buildFlow();
  return _flow.run(input);
}
