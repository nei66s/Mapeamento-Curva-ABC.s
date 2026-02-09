"use server";
/**
 * Server-only implementation for Pareto analysis.
 * This file is imported dynamically from the lightweight wrapper so that
 * server-only dependencies remain off the client bundle.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'zod';

export type ParetoAnalysisInput = { incidents: string[] };
export type ParetoAnalysisOutput = { analysis: { category: string; count: number }[] };

async function buildFlow() {
  // Dynamic import of `z` so we only load it on the server at runtime.
  const { z: _z } = { z };
  const ai = await getAi();

  const ParetoAnalysisInputSchema = z.object({
    incidents: z
      .array(z.string().describe('A descriptive title or summary of a single maintenance incident.'))
      .describe('An array of incident descriptions to be analyzed and categorized.'),
  });

  const ParetoAnalysisOutputSchema = z.object({
    analysis: z
      .array(
        z.object({
          category: z.string().describe('The identified root cause category for a group of incidents.'),
          count: z.number().describe('The number of incidents belonging to this category.'),
        })
      )
      .describe('An array of incident categories and their counts, sorted in descending order of count.'),
  });

  const prompt = ai.definePrompt({
    name: 'paretoAnalysisPrompt',
    input: { schema: ParetoAnalysisInputSchema },
    output: { schema: ParetoAnalysisOutputSchema },
    prompt: `You are an expert maintenance analyst specializing in root cause analysis.
    Your task is to analyze a list of incident descriptions, group them by their most likely root cause category, and count the number of incidents in each category.

    Here is the list of incidents:
    {{#each incidents}}
    - {{{this}}}
    {{/each}}

    Instructions:
    1. Read all incident descriptions carefully.
    2. Identify common themes and group them into logical root cause categories (e.g., "Falha Elétrica", "Problema Mecânico", "Desgaste de Peça", "Erro Operacional", "Vazamento", "Obstrução"). Use Portuguese for the categories.
    3. Count how many incidents fall into each category.
    4. Return a list of objects, where each object contains the 'category' and its 'count'.
    5. **Crucially, sort the final list in descending order based on the count.** This is for a Pareto analysis.
    `,
  });

  const paretoAnalysisFlow = ai.defineFlow(
    {
      name: 'paretoAnalysisFlow',
      inputSchema: ParetoAnalysisInputSchema,
      outputSchema: ParetoAnalysisOutputSchema,
    },
    async (input: { incidents: string[] }) => {
      if (input.incidents.length === 0) {
        return { analysis: [] };
      }
      const { callWithRetries } = await import('@/ai/callWithRetries');
      const { output } = await callWithRetries(() => prompt(input));
      return output!;
    }
  );

  return {
    run: async (input: ParetoAnalysisInput): Promise<ParetoAnalysisOutput> => paretoAnalysisFlow(input as any),
  };
}

let _flow: { run: (input: ParetoAnalysisInput) => Promise<ParetoAnalysisOutput> } | null = null;

export async function runParetoAnalysis(input: ParetoAnalysisInput): Promise<ParetoAnalysisOutput> {
  if (!_flow) {
    _flow = await buildFlow();
  }
  return _flow.run(input);
}
