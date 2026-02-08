import { z } from 'zod';

export const ParetoInputSchema = z.object({
  mes: z.string().nullable().optional(),
  slice: z.array(z.object({ category: z.string(), count: z.number() })),
});

export type ParetoInput = z.infer<typeof ParetoInputSchema>;

export const ParetoOutputSchema = z.object({ summary: z.string() });
export type ParetoOutput = z.infer<typeof ParetoOutputSchema>;

export async function summarizePareto(input: ParetoInput): Promise<ParetoOutput> {
  const impl = await import('./summarize-pareto-flow.server');
  return impl.runSummarizePareto(input);
}
