import { getAi } from '@/ai/genkit';

export type ScopeTextImprovementInput = {
  text: string;
  context?: string;
  tone?: string;
};

export type ScopeTextImprovementOutput = {
  improved: string;
};

async function buildFlow() {
  const { z } = await import('genkit');
  const ai = await getAi();

  const ScopeTextImprovementInputSchema = z.object({
    text: z.string().min(3).describe('Texto base do escopo ou item que precisa ser melhorado.'),
    context: z.string().max(400).optional().describe('Contexto adicional para deixar a resposta alinhada com o objetivo.'),
    tone: z.string().max(50).optional().describe('Tom desejado para o texto.')
  });

  const ScopeTextImprovementOutputSchema = z.object({
    improved: z.string().describe('Texto reescrito com clareza e linguagem profissional.')
  });

  const prompt = ai.definePrompt({
    name: 'scopeTextImprovementPrompt',
    input: { schema: ScopeTextImprovementInputSchema },
    output: { schema: ScopeTextImprovementOutputSchema },
    prompt: `Você é um especialista em planejamento de manutenção e escopos técnicos. Sua missão é reescrever o texto abaixo para deixá-lo mais claro, conciso e orientado para ação.` +
      `

Contexto extra: {{{context}}}` +
      `
Tom desejado: {{{tone}}}` +
      `

Texto original:
{{{text}}}

Texto reescrito:`
  });

  const flow = ai.defineFlow(
    {
      name: 'scopeTextImprovementFlow',
      inputSchema: ScopeTextImprovementInputSchema,
      outputSchema: ScopeTextImprovementOutputSchema,
    },
    async (input: ScopeTextImprovementInput) => {
      const { output } = await prompt(input as any);
      return output!;
    }
  );

  return { run: async (input: ScopeTextImprovementInput) => flow(input as any) };
}

let _flow: { run: (input: ScopeTextImprovementInput) => Promise<ScopeTextImprovementOutput> } | null = null;

export async function runScopeTextImprovement(
  input: ScopeTextImprovementInput
): Promise<ScopeTextImprovementOutput> {
  if (!_flow) {
    _flow = await buildFlow();
  }
  return _flow.run(input);
}
