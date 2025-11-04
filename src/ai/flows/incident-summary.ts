'use server';
/**
 * @fileOverview Provides a summary of incidents, including potential mitigations.
 *
 * - getIncidentSummary - A function that retrieves the incident summary.
 * - IncidentSummaryInput - The input type for the getIncidentSummary function.
 * - IncidentSummaryOutput - The return type for the getIncidentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IncidentSummaryInputSchema = z.object({
  incidentDetails: z.string().describe('Details of the incident.'),
  equipmentDetails: z.string().describe('Details of the affected equipment.'),
  location: z.string().describe('The location where the incident occurred.'),
  impact: z.string().describe('The operational impact of the incident (safety, production, sales, environmental).'),
});
export type IncidentSummaryInput = z.infer<typeof IncidentSummaryInputSchema>;

const IncidentSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the incident, its potential impact, and possible mitigations.'),
});
export type IncidentSummaryOutput = z.infer<typeof IncidentSummaryOutputSchema>;

export async function getIncidentSummary(input: IncidentSummaryInput): Promise<IncidentSummaryOutput> {
  return incidentSummaryFlow(input);
}

const incidentSummaryPrompt = ai.definePrompt({
  name: 'incidentSummaryPrompt',
  input: {schema: IncidentSummaryInputSchema},
  output: {schema: IncidentSummaryOutputSchema},
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
  async input => {
    const {output} = await incidentSummaryPrompt(input);
    return output!;
  }
);
