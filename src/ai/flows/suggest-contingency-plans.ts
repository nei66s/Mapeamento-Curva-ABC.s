'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant contingency plans based on the characteristics of a logged incident.
 *
 * - suggestContingencyPlans - A function that takes incident characteristics as input and returns suggested contingency plans.
 * - SuggestContingencyPlansInput - The input type for the suggestContingencyPlans function.
 * - SuggestContingencyPlansOutput - The return type for the suggestContingencyPlans function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContingencyPlansInputSchema = z.object({
  incidentDescription: z
    .string()
    .describe('A detailed description of the incident.'),
  equipmentType: z.string().describe('The type of equipment involved.'),
  criticality: z
    .enum(['A', 'B', 'C'])
    .describe('The criticality level of the equipment (A, B, or C).'),
  impact: z
    .string()
    .describe(
      'The operational impact of the incident (e.g., safety, production, sales, environmental).'
    ),
});
export type SuggestContingencyPlansInput = z.infer<
  typeof SuggestContingencyPlansInputSchema
>;

const SuggestContingencyPlansOutputSchema = z.object({
  suggestedPlans: z
    .array(z.string())
    .describe('An array of suggested contingency plans.'),
});
export type SuggestContingencyPlansOutput = z.infer<
  typeof SuggestContingencyPlansOutputSchema
>;

export async function suggestContingencyPlans(
  input: SuggestContingencyPlansInput
): Promise<SuggestContingencyPlansOutput> {
  return suggestContingencyPlansFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestContingencyPlansPrompt',
  input: {schema: SuggestContingencyPlansInputSchema},
  output: {schema: SuggestContingencyPlansOutputSchema},
  prompt: `You are an expert in risk management and contingency planning for retail maintenance.
  Based on the incident description, equipment type, criticality, and operational impact, suggest relevant contingency plans.

  Incident Description: {{{incidentDescription}}}
  Equipment Type: {{{equipmentType}}}
  Criticality: {{{criticality}}}
  Impact: {{{impact}}}

  Provide a list of suggested contingency plans that can be implemented to address the incident. Be brief and to the point.
  Respond in bulleted format.
  `,
});

const suggestContingencyPlansFlow = ai.defineFlow(
  {
    name: 'suggestContingencyPlansFlow',
    inputSchema: SuggestContingencyPlansInputSchema,
    outputSchema: SuggestContingencyPlansOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
