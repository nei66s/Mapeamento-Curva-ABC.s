"use server";
import { getAi } from '@/ai/genkit';
import { callWithRetries } from '@/ai/callWithRetries';
import { z } from 'zod';

export type GenerateAssetMetadataInput = {
  assetName: string;
  storeName?: string;
  patrimony?: string;
  hierarchy?: string;
};

export type GenerateAssetMetadataOutput = {
  insumos: {
    name: string;
    description: string;
    quantity?: number;
    safetyStock?: boolean;
    stockLocation?: string;
  }[];
  componentes: {
    name: string;
    description: string;
    maintenanceComplexity: string;
    costEstimate: string;
    stockAvailable?: boolean;
    criticality?: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  }[];
  componentInsights: string;
};

async function buildFlow() {
  const ai = await getAi();

  const AssetMetadataInputSchema = z.object({
    assetName: z.string().describe('Nome do ativo ou equipamento principal.'),
    storeName: z.string().optional().describe('Loja ou unidade associada, se houver.'),
    patrimony: z.string().optional().describe('Código de patrimônio, se já existir.'),
    hierarchy: z.string().optional().describe('Descrição breve da hierarquia do ativo.'),
  });

  const AssetMetadataOutputSchema = z.object({
    insumos: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        quantity: z.number().int().nonnegative().optional(),
        safetyStock: z.boolean().optional(),
        stockLocation: z.string().optional(),
      })
    ),
    componentes: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        maintenanceComplexity: z.string(),
        costEstimate: z.string(),
        stockAvailable: z.boolean().optional(),
        criticality: z.enum(['Baixa', 'Média', 'Alta', 'Crítica']).optional(),
      })
    ),
    componentInsights: z.string(),
  });

  const prompt = ai.definePrompt({
    name: 'generateAssetMetadataPrompt',
    input: { schema: AssetMetadataInputSchema },
    output: { schema: AssetMetadataOutputSchema },
    prompt: `Você é um especialista em manutenção que organiza hierarquias de ativos para o varejo.
A partir dos dados abaixo, gere um JSON com os insumos e componentes críticos do ativo informado.
Instruções:
1. Responda apenas com o JSON correspondente ao schema definido.
2. Para cada insumo indique nome, descrição breve, quantidade aproximada (se possível), se deve ficar em estoque de segurança e onde costuma ser guardado.
3. Para os componentes informe nome, descrição, complexidade da manutenção, estimativa de custo (ex: "baixo", "médio", "alto" ou valores aproximados) e se há estoque disponível; adicione também o nível de criticidade (Baixa, Média, Alta ou Crítica).
  4. Em 'componentInsights', escreva um parágrafo curto (em português) explicando a complexidade da manutenção e o quanto esse componente pesa no custo total.

Dados do ativo:
- Nome: {{{assetName}}}
- Loja: {{{storeName}}}
- Patrimônio: {{{patrimony}}}
- Hierarquia: {{{hierarchy}}}
`,
  });

  const flow = ai.defineFlow(
    {
      name: 'generateAssetMetadataFlow',
      inputSchema: AssetMetadataInputSchema,
      outputSchema: AssetMetadataOutputSchema,
    },
    async (input: GenerateAssetMetadataInput) => {
      const { output } = await callWithRetries(() => prompt(input as any));
      return output!;
    }
  );

  return { run: async (input: GenerateAssetMetadataInput) => flow(input as any) };
}

let _flow: { run: (input: GenerateAssetMetadataInput) => Promise<GenerateAssetMetadataOutput> } | null = null;

export async function runGenerateAssetMetadata(
  input: GenerateAssetMetadataInput
): Promise<GenerateAssetMetadataOutput> {
  if (!_flow) _flow = await buildFlow();
  return _flow.run(input);
}
