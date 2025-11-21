"use server";
import { getAi } from '@/ai/genkit';

export type SuggestContingencyPlansInput = {
  incidentDescription: string;
  equipmentType: string;
  criticality: 'A' | 'B' | 'C';
  impact: string;
};

export type SuggestContingencyPlansOutput = { suggestedPlans: string[] };

async function buildFlow() {
  const { z } = await import('genkit');
  const ai = await getAi();

  const SuggestContingencyPlansInputSchema = z.object({
    incidentDescription: z.string().describe('A detailed description of the incident.'),
    equipmentType: z.string().describe('The type of equipment involved.'),
    criticality: z.enum(['A', 'B', 'C']).describe('The criticality level of the equipment.'),
    impact: z.string().describe('The operational impact of the incident.'),
  });

  const SuggestContingencyPlansOutputSchema = z.object({
    suggestedPlans: z.array(z.string()).describe('An array of suggested contingency plans.'),
  });

  const prompt = ai.definePrompt({
    name: 'suggestContingencyPlansPrompt',
    input: { schema: SuggestContingencyPlansInputSchema },
    output: { schema: SuggestContingencyPlansOutputSchema },
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
    async (input: SuggestContingencyPlansInput) => {
      const { callWithRetries } = await import('@/ai/callWithRetries');
      const { output } = await callWithRetries(() => prompt(input as any));
      return output!;
    }
  );

  return { run: async (input: SuggestContingencyPlansInput) => suggestContingencyPlansFlow(input as any) };
}

let _flow: { run: (input: SuggestContingencyPlansInput) => Promise<SuggestContingencyPlansOutput> } | null = null;

export async function runSuggestContingencyPlans(input: SuggestContingencyPlansInput): Promise<SuggestContingencyPlansOutput> {
  if (!_flow) _flow = await buildFlow();
  return _flow.run(input);
}
