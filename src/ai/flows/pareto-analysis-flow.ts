'use server';
/**
 * @fileOverview Provides an AI-powered Pareto analysis of maintenance incidents.
 *
 * - analyzeIncidentsForPareto - A function that takes a list of incidents and returns a categorized summary for a Pareto chart.
 * - ParetoAnalysisInput - The input type for the function.
 * - ParetoAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParetoAnalysisInputSchema = z.object({
  incidents: z
    .array(z.string().describe('A descriptive title or summary of a single maintenance incident.'))
    .describe('An array of incident descriptions to be analyzed and categorized.'),
});
export type ParetoAnalysisInput = z.infer<typeof ParetoAnalysisInputSchema>;

const ParetoAnalysisOutputSchema = z.object({
  analysis: z
    .array(
      z.object({
        category: z.string().describe('The identified root cause category for a group of incidents (e.g., "Falha Elétrica", "Problema Mecânico", "Erro Operacional").'),
        count: z.number().describe('The number of incidents belonging to this category.'),
      })
    )
    .describe('An array of incident categories and their counts, sorted in descending order of count.'),
});
export type ParetoAnalysisOutput = z.infer<typeof ParetoAnalysisOutputSchema>;


export async function analyzeIncidentsForPareto(
  input: ParetoAnalysisInput
): Promise<ParetoAnalysisOutput> {
  return paretoAnalysisFlow(input);
}

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
  async input => {
    if (input.incidents.length === 0) {
      return { analysis: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
