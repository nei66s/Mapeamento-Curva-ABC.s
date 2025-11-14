import { getAi } from '@/ai/genkit';

export type ScopeItemDescriptionInput = {
  title: string;
  context?: string;
  tone?: string;
};

export type ScopeItemDescriptionOutput = {
  description: string;
};

async function buildFlow() {
  const { z } = await import('genkit');
  const ai = await getAi();

  const ScopeItemDescriptionInputSchema = z.object({
    title: z.string().min(3).describe('Título do item que precisa de descrição.'),
    context: z.string().max(400).optional().describe('Contexto adicional do escopo.'),
    tone: z.string().max(50).optional().describe('Tom desejado para a linguagem.'),
  });

  const ScopeItemDescriptionOutputSchema = z.object({
    description: z.string().describe('Descrição profissional e orientada ao escopo do item.'),
  });

  const prompt = ai.definePrompt({
    name: 'scopeItemDescriptionPrompt',
    input: { schema: ScopeItemDescriptionInputSchema },
    output: { schema: ScopeItemDescriptionOutputSchema },
    prompt: `Você é um engenheiro de manutenção responsável por descrever atividades técnicas com clareza e foco em resultados.

Dado o título abaixo e o contexto geral, escreva um parágrafo curto que explique o que precisa ser feito, os critérios mínimos de qualidade e as evidências esperadas.

Título do item: {{{title}}}
Contexto: {{{context}}}
Tom desejado: {{{tone}}}

Descrição:`,
  });

  const flow = ai.defineFlow(
    {
      name: 'scopeItemDescriptionFlow',
      inputSchema: ScopeItemDescriptionInputSchema,
      outputSchema: ScopeItemDescriptionOutputSchema,
    },
    async (input: ScopeItemDescriptionInput) => {
      const { output } = await prompt(input as any);
      return output!;
    }
  );

  return { run: async (input: ScopeItemDescriptionInput) => flow(input as any) };
}

let _flow: { run: (input: ScopeItemDescriptionInput) => Promise<ScopeItemDescriptionOutput> } | null = null;

export async function runScopeItemDescription(
  input: ScopeItemDescriptionInput
): Promise<ScopeItemDescriptionOutput> {
  if (!_flow) {
    _flow = await buildFlow();
  }
  return _flow.run(input);
}
