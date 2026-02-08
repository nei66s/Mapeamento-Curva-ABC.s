"use server";
import { getAi } from '@/ai/genkit';
import { z } from 'zod';

export type ParetoInput = {
  mes?: string | null;
  slice: { category: string; count: number }[];
};

export type ParetoOutput = { summary: string };

async function buildFlow() {
  const ai = await getAi();

  const ParetoInputSchema = z.object({
    mes: z.string().nullable().optional(),
    slice: z.array(z.object({ category: z.string(), count: z.number() })),
  });

  const ParetoOutputSchema = z.object({ summary: z.string() });

  const paretoPrompt = ai.definePrompt({
    name: 'paretoSummary',
    input: { schema: ParetoInputSchema },
    output: { schema: ParetoOutputSchema },
    prompt: `Você é um especialista em manutenção e confiabilidade. Analise a lista a seguir das principais categorias (Pareto) e gere um breve resumo executivo em Português com:
1. Principais causas identificadas.
2. Impacto operacional e risco associado.
3. Recomendações práticas de ação (3 passos).
Use números absolutos quando disponíveis e mantenha o texto objetivo.`,
  });

  const paretoFlow = ai.defineFlow(
    { name: 'paretoFlow', inputSchema: ParetoInputSchema, outputSchema: ParetoOutputSchema },
    async (input: ParetoInput) => {
      const { callWithRetries } = await import('@/ai/callWithRetries');
      const { output } = await callWithRetries(() => paretoPrompt(input as any), 3, 300);
      const text = String(
        output?.summary ?? output?.text ?? output?.result ?? output?.description ?? output?.improved ?? ''
      ).trim();
      return { summary: text };
    }
  );

  return { run: async (input: ParetoInput) => paretoFlow(input as any) };
}

let _flow: { run: (input: ParetoInput) => Promise<ParetoOutput> } | null = null;

export async function runSummarizePareto(input: ParetoInput): Promise<ParetoOutput> {
  if (!_flow) _flow = await buildFlow();
  return _flow.run(input);
}
