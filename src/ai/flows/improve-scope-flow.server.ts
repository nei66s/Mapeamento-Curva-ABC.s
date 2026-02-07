import { getAi } from '@/ai/genkit';

export type ScopeTextImprovementInput = {
  text: string;
  context?: string;
  tone?: string;
  preferenceText?: string;
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
    tone: z.string().max(50).optional().describe('Tom desejado para o texto.'),
    preferenceText: z.string().max(200).optional().describe('Preferência do autor sobre detalhamento ou deixar ao fornecedor.')
  });

  const ScopeTextImprovementOutputSchema = z.object({
    improved: z.string().describe('Texto reescrito com clareza e linguagem profissional.'),
    norms: z.array(z.object({ code: z.string().optional(), name: z.string(), area: z.string().optional() })).optional().describe('Array estruturado de normas aplicáveis, cada item com código, nome e área.')
  });

  const prompt = ai.definePrompt({
    name: 'scopeTextImprovementPrompt',
    input: { schema: ScopeTextImprovementInputSchema },
    output: { schema: ScopeTextImprovementOutputSchema },
      prompt: `Você é um especialista em planejamento de manutenção e escopos técnicos. Sua missão é reescrever o texto abaixo para deixá-lo mais claro, conciso e orientado para ação.` +
    `

  Contexto extra: {{{context}}}` +
    `
  Preferência: {{{preferenceText}}}` +
    `
  Tom desejado: {{{tone}}}` +
    `

  Texto original:
  {{{text}}}

  Texto reescrito:`
  });

  // Enhance the prompt: ask the model to list applicable technical standards (normas) after the rewritten text,
  // prioritizing norms by technical area to make it easier to review (e.g., Metalurgia/Soldagem, Estruturas Metálicas, Pintura/Proteção).
  // Request a predictable, parsable format so the frontend can display it directly.
  // Request a machine-readable JSON block after the rewritten text so the flow can return structured norms.
  prompt.prompt = prompt.prompt + `

  Em seguida, adicione uma seção iniciada por "Normas Aplicáveis:" com uma lista legível, e logo após isso inclua UMA LINHA EXATA: NORMAS_JSON: seguida de um JSON array contendo objetos com os campos {"code","name","area"}.
  Exemplo (após a seção legível):
  NORMAS_JSON: [{"code":"NBR 8800","name":"Projeto de estruturas de aço","area":"Estruturas Metálicas"}, {"code":"NBR 6492","name":"Representação de projetos de arquitetura","area":"Desenho Técnico"}]

  - Se não houver normas específicas, depois de NORMAS_JSON coloque um array vazio: NORMAS_JSON: []
  - O JSON deve estar em uma única linha exatamente após o prefixo 'NORMAS_JSON:' para facilitar parse.
  - Não inclua comentários ou texto adicional após o JSON.
  - Mantenha a seção legível e sucinta; o JSON é apenas para uso programático.
  Isso garante que a saída possa ser convertida em um array estruturado sem parsing frágil.`;

  const flow = ai.defineFlow(
    {
      name: 'scopeTextImprovementFlow',
      inputSchema: ScopeTextImprovementInputSchema,
      outputSchema: ScopeTextImprovementOutputSchema,
    },
    async (input: ScopeTextImprovementInput) => {
      const { callWithRetries } = await import('@/ai/callWithRetries');
      const { output } = await callWithRetries(() => prompt(input as any));
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
