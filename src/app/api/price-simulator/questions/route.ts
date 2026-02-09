export const runtime = 'nodejs';

import { NextResponse } from 'next/server'
import { getAi } from '@/ai/genkit'
import { z } from 'zod'
import { callWithRetries } from '@/ai/callWithRetries'
import { normalizeIncoming } from '../utils'

type Question = {
  id: string
  question: string
  type: 'yesno' | 'number' | 'text' | 'select'
  options?: string[]
  required?: boolean
  hint?: string
}

async function heuristicQuestions(payload: any): Promise<Question[]> {
  const t = (payload.type || '').toLowerCase()
  const questions: Question[] = []

  if (t === 'civil') {
    questions.push({ id: 'includeHydraulica', question: 'Incluir serviços hidráulicos?', type: 'yesno', required: false })
    questions.push({ id: 'hydraulicPoints', question: 'Quantos pontos hidráulicos (aprox.)?', type: 'number', required: false, hint: 'Ex.: 2 (torneira + ponto)' })
    questions.push({ id: 'includeEletrica', question: 'Incluir serviços elétricos?', type: 'yesno' })
    questions.push({ id: 'electricPoints', question: 'Quantos pontos elétricos (aprox.)?', type: 'number', required: false })
    questions.push({ id: 'includeDisposal', question: 'Incluir remoção / bota-fora?', type: 'yesno' })
    questions.push({ id: 'demolition', question: 'Haverá demolição / remoção de alvenaria existente?', type: 'yesno' })
    questions.push({ id: 'demolitionVolume', question: 'Volume estimado de demolição (m³)?', type: 'number', required: false })
    questions.push({ id: 'scaffolding', question: 'Precisa de andaimes / acesso especial?', type: 'yesno' })
    questions.push({ id: 'permits', question: 'São necessárias licenças/alvarás?', type: 'yesno' })
    questions.push({ id: 'workingAtHeight', question: 'Trabalho em altura previsto?', type: 'yesno' })
    questions.push({ id: 'accessConstraints', question: 'Restrições de acesso (obs):', type: 'text', required: false })
  } else if (t === 'equipamento') {
    questions.push({ id: 'warranty', question: 'O equipamento inclui garantia estendida?', type: 'yesno' })
    questions.push({ id: 'requiresCalibration', question: 'Requer calibração ou testes?', type: 'yesno' })
    questions.push({ id: 'spareParts', question: 'Peças de reposição inclusas?', type: 'yesno' })
  } else {
    // manutenção
    questions.push({ id: 'requiresShutdown', question: 'Requer parada/interruptão da operação?', type: 'yesno' })
    questions.push({ id: 'shutdownHours', question: 'Duração estimada da parada (horas)', type: 'number', required: false })
    questions.push({ id: 'sparePartsNeeded', question: 'Há previsão de peças de reposição?', type: 'yesno' })
  }

  return questions
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(async () => {
      const text = await request.text()
      throw new Error('invalid-json-body: ' + String(text).slice(0, 200))
    })

    const input = normalizeIncoming(raw)

    // Try AI-generated questions when Genkit is available
    try {
      const { z: _z } = { z }
      const ai = await getAi({ modelOptions: { temperature: 0 } })

      // define simple prompt: output an array of question objects
      const QuestionSchema = z.object({ id: z.string(), question: z.string(), type: z.string().optional(), options: z.array(z.string()).optional(), required: z.boolean().optional(), hint: z.string().optional() })
      const OutputSchema = z.array(QuestionSchema)

      const prompt = ai.definePrompt({
        name: 'priceQuestionPrompt',
        input: { schema: z.object({ description: z.string().optional(), type: z.string().optional(), location: z.string().optional(), clarify: z.any().optional() }) },
        output: { schema: OutputSchema },
        prompt: `Você é um assistente técnico que precisa gerar uma lista de perguntas relevantes e acionáveis para obter dados faltantes que melhorem uma estimativa de custo para serviços no Brasil.

  IMPORTANTE: todas as solicitações tratadas aqui referem-se a trabalhos em supermercados varejistas (supermercados, mercearias, lojas de varejo alimentar). Ao elaborar perguntas, priorize elementos que impactam custo e execução em varejo: refrigeração/câmaras frias, pontos de refrigeração, horários de atendimento, necessidade de fechamento parcial do estabelecimento, exigências sanitárias, remoção de resíduos alimentares, e acessos para cargas/pallets.

Dada a descrição e contexto, retorne APENAS um JSON com um array de objetos com campos: id, question, type (uma de: yesno, number, text, select), optional options (lista de strings) e optional hint.

Priorize perguntas que realmente impactam o custo (hidráulica, pontos elétricos, remoção/bota-fora, necessidade de andaime, alvarás). Gere entre 3 e 12 perguntas, adaptadas ao tipo informado.

Descrição: {{{description}}}
Tipo: {{{type}}}
Local: {{{location}}}
Clarificações já fornecidas: {{{clarify}}}

        Retorne apenas o JSON conforme o schema.`,
      })

      const flow = ai.defineFlow({ name: 'priceQuestionFlow', inputSchema: prompt.inputSchema, outputSchema: prompt.outputSchema }, async (data: any) => {
        const { output } = await callWithRetries(() => prompt(data as any))
        return output!
      })

      const aiOutput = await flow({ description: input.description ?? '', type: input.type ?? '', location: input.location ?? '', clarify: input.clarify ?? undefined })
      // Validate / normalise
      const questions = Array.isArray(aiOutput) ? aiOutput.map((q: any, i: number) => ({
        id: String(q.id ?? `q${i + 1}`),
        question: String(q.question ?? q.text ?? ''),
        type: (q.type as any) === 'number' ? 'number' : (q.type as any) === 'select' ? 'select' : (q.type as any) === 'yesno' ? 'yesno' : 'text',
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        required: Boolean(q.required),
        hint: q.hint ? String(q.hint) : undefined,
      })) : []

      if (questions.length === 0) throw new Error('AI returned no questions')
      return NextResponse.json({ ok: true, questions })
    } catch (aiErr) {
      // Fallback: return heuristic questions
      const questions = await heuristicQuestions(input)
      return NextResponse.json({ ok: true, questions })
    }
  } catch (err: any) {
    const message = err?.message ?? String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, info: 'POST JSON payload to get follow-up questions for price simulation' })
}
