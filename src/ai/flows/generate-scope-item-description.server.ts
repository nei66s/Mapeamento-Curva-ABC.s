import { getAi } from '@/ai/genkit';

export type ScopeItemDescriptionInput = {
  title: string;
  context?: string;
  tone?: string;
  preferenceText?: string;
};

export type ScopeItemDescriptionOutput = {
  description: string;
  generatedBy?: 'ai' | 'heuristic';
  aiMeta?: {
    attempts?: number;
    lastError?: { message: string; status?: number } | null;
  } | null;
};

async function buildFlow() {
  const { z } = await import('genkit');
  const ai = await getAi();

  const ScopeItemDescriptionInputSchema = z.object({
    title: z.string().min(3).describe('Título do item que precisa de descrição.'),
    context: z.string().max(400).optional().describe('Contexto adicional do escopo.'),
    tone: z.string().max(50).optional().describe('Tom desejado para a linguagem.'),
    preferenceText: z.string().max(200).optional().describe('Preferência do autor sobre detalhamento ou deixar ao fornecedor.'),
  });

  const ScopeItemDescriptionOutputSchema = z.object({
    description: z.string().describe('Descrição profissional e orientada ao escopo do item.'),
    generatedBy: z.enum(['ai', 'heuristic']).optional(),
    aiMeta: z
      .object({
        attempts: z.number().optional(),
        lastError: z
          .object({ message: z.string(), status: z.number().optional() })
          .optional(),
      })
      .optional(),
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

Preferência: {{{preferenceText}}}

Descrição:`,
  });

  const flow = ai.defineFlow(
    {
      name: 'scopeItemDescriptionFlow',
      inputSchema: ScopeItemDescriptionInputSchema,
      outputSchema: ScopeItemDescriptionOutputSchema,
    },
    async (input: ScopeItemDescriptionInput) => {
      const { callWithRetries } = await import('@/ai/callWithRetries');
      try {
        const { output } = await callWithRetries(() => prompt(input as any));
        if (output && output.description) {
          return { ...output, generatedBy: 'ai' } as any;
        }
      } catch (err: any) {
        console.warn(
          'generate-scope-item-description: AI call failed, falling back to heuristic generator',
          err?.message ?? err
        );
        // capture metadata if available
        const aiMeta = err?.meta ?? { lastError: { message: String(err?.message ?? err) } };
        // continue to fallback but include aiMeta in the response
        const lines: string[] = [];
        const title = String(input.title || '').trim();
        const context = String(input.context || '').trim();
        if (title) lines.push(`${title}:`);
        if (context) lines.push(`${context}`);
        const tone = input.tone ? `Tom: ${input.tone}.` : '';
        const preference = input.preferenceText ? `${input.preferenceText}` : '';

        const bodyParts: string[] = [];
        if (lines.length > 0) bodyParts.push(lines.join(' '));
        if (preference) bodyParts.push(preference);
        if (tone) bodyParts.push(tone);
        const description = (bodyParts.join(' ').trim() || `${title} — descrição técnica a ser detalhada pelo fornecedor.`).replace(/\n+/g, ' ');
        return { description, generatedBy: 'heuristic', aiMeta } as any;
      }

      // If AI returned no description for some reason, fall back to a lightweight heuristic (no error meta)

      // Fallback heuristic: synthesize a concise, professional description from available fields
      const lines: string[] = [];
      const title = String(input.title || '').trim();
      const context = String(input.context || '').trim();
      if (title) lines.push(`${title}:`);
      if (context) lines.push(`${context}`);
      const tone = input.tone ? `Tom: ${input.tone}.` : '';
      const preference = input.preferenceText ? `${input.preferenceText}` : '';

      const bodyParts: string[] = [];
      if (lines.length > 0) bodyParts.push(lines.join(' '));
      if (preference) bodyParts.push(preference);
      if (tone) bodyParts.push(tone);
      const description = (bodyParts.join(' ').trim() || `${title} — descrição técnica a ser detalhada pelo fornecedor.`).replace(/\n+/g, ' ');
      return { description, generatedBy: 'heuristic' } as any;
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
