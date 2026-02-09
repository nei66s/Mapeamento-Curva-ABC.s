"use server";
import { getAi } from '@/ai/genkit';
import { z } from 'zod';

export type IncidentSummaryInput = {
  incidentDetails: string;
  equipmentDetails: string;
  location: string;
  impact: string;
};

export type IncidentSummaryOutput = { summary: string };

async function buildFlow() {
  const { z: _z } = { z };
  const ai = await getAi();

  const IncidentSummaryInputSchema = z.object({
    incidentDetails: z.string().describe('Details of the incident.'),
    equipmentDetails: z.string().describe('Details of the affected equipment.'),
    location: z.string().describe('The location where the incident occurred.'),
    impact: z.string().describe('The operational impact of the incident.'),
  });

  const IncidentSummaryOutputSchema = z.object({
    summary: z.string().describe('A summary of the incident, its potential impact, and possible mitigations.'),
  });

  const incidentSummaryPrompt = ai.definePrompt({
    name: 'incidentSummaryPrompt',
    input: { schema: IncidentSummaryInputSchema },
    output: { schema: IncidentSummaryOutputSchema },
    prompt: `You are an expert in summarizing incident reports for regional managers, focusing on impact and mitigation.

    Given the following incident details, provide a concise summary that includes the potential operational impact (safety, production, sales, environmental) and suggests possible mitigation strategies.

    Incident Details: {{{incidentDetails}}}
    Equipment Details: {{{equipmentDetails}}}
    Location: {{{location}}}
    Impact: {{{impact}}}

    Summary:`,
  });

  const incidentSummaryFlow = ai.defineFlow(
    {
      name: 'incidentSummaryFlow',
      inputSchema: IncidentSummaryInputSchema,
      outputSchema: IncidentSummaryOutputSchema,
    },
    async (input: IncidentSummaryInput) => {
      const { output } = await incidentSummaryPrompt(input as any);
      return output!;
    }
  );

  return { run: async (input: IncidentSummaryInput) => incidentSummaryFlow(input as any) };
}

let _flow: { run: (input: IncidentSummaryInput) => Promise<IncidentSummaryOutput> } | null = null;

export async function runIncidentSummary(input: IncidentSummaryInput): Promise<IncidentSummaryOutput> {
  if (!_flow) _flow = await buildFlow();
  return _flow.run(input);
}
