"use server";

export type SuggestContingencyPlansInput = {
  incidentDescription: string;
  equipmentType: string;
  criticality: 'A' | 'B' | 'C';
  impact: string;
};

export type SuggestContingencyPlansOutput = { suggestedPlans: string[] };

export async function suggestContingencyPlans(
  input: SuggestContingencyPlansInput
): Promise<SuggestContingencyPlansOutput> {
  const impl = await import('./suggest-contingency-plans.server');
  return impl.runSuggestContingencyPlans(input);
}
