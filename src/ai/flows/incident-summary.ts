"use server";
/**
 * Server action wrapper for incident summary. Delegates to a server-only
 * implementation to avoid importing Genkit at module scope.
 */

export type IncidentSummaryInput = {
  incidentDetails: string;
  equipmentDetails: string;
  location: string;
  impact: string;
};

export type IncidentSummaryOutput = { summary: string };

export async function getIncidentSummary(input: IncidentSummaryInput): Promise<IncidentSummaryOutput> {
  const impl = await import('./incident-summary.server');
  return impl.runIncidentSummary(input);
}
