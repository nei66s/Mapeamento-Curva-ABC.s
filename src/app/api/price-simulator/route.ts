export const runtime = 'nodejs';

import { NextResponse } from 'next/server'
import { getAi } from '@/ai/genkit'
import { callWithRetries } from '@/ai/callWithRetries'
import { logPriceSimulatorEvent } from '@/lib/price-simulator-logger'
import { SimulatorInput, normalizeIncoming } from './utils'

function round(v: number) {
  return Math.round(v * 100) / 100
}

function heuristicEstimate(payload: SimulatorInput) {
  const base = 200.0
  let estimate = base
  const breakdown: Array<{ label: string; amount: number }> = []

  const t = (payload.type || '').toLowerCase()

  if (t === 'equipamento') {
    const horas = payload.horasUso ?? 0
    const marcaFactor = payload.equipamentoMarca ? 1.1 : 1.0
    estimate = 500 + horas * 2 * marcaFactor
    breakdown.push({ label: 'Base equipamento', amount: 500 })
    breakdown.push({ label: 'Uso (horas)', amount: round(horas * 2 * marcaFactor) })
  } else if (t === 'civil') {
    const area = payload.area ?? 10
    const quality = payload.materialQualidade ?? 'medium'
    const qualityFactor = quality === 'low' ? 0.9 : quality === 'high' ? 1.3 : 1.0
    // If this is a supermarket retail context, civil works tend to require more precautions,
    // refrigeration access, hygiene, and smaller working windows -> scale costs up
    const retailKeywords = ['supermercado', 'varejista', 'mercado', 'mercearia', 'supermarket']
    const description = (payload.description || '').toLowerCase()
    const isRetail = retailKeywords.some((k) => description.includes(k))
    const perM2 = isRetail ? 220 : 150
    estimate = perM2 * area * qualityFactor
    breakdown.push({ label: 'Área (m²)', amount: round(perM2 * area) })
    if (isRetail) breakdown.push({ label: 'Contexto: supermercado (práticas e janelas de trabalho)', amount: round((perM2 - 150) * area) })
    breakdown.push({ label: 'Qualidade material', amount: round((qualityFactor - 1) * 100) })
  } else {
    // manutenção (default)
    const hours = payload.estimativaEquipeHoras ?? 4
    estimate = 100 * hours
    breakdown.push({ label: 'Horas equipe', amount: 100 * hours })
  }

  if (payload.precisaAlvara) {
    breakdown.push({ label: 'Alvará / licenças', amount: 300 })
    estimate += 300
  }

  // clamp and round
  estimate = Math.max(estimate, 50)
  estimate = round(estimate)

  return { estimate, currency: 'BRL', breakdown }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(async () => {
      const text = await request.text()
      throw new Error('invalid-json-body: ' + String(text).slice(0, 200))
    })

    const input = normalizeIncoming(raw)
    await logPriceSimulatorEvent(`incoming price-simulator request | tipo=${input.type ?? 'n/a'} | cidade=${input.location ?? 'n/a'}`)

    // If client asked for deterministic / heuristic result, skip AI
    if (input.deterministic || input.forceHeuristic) {
      console.debug('Price simulator: deterministic/forceHeuristic requested, using heuristic path')
      const result = heuristicEstimate(input)
      await logPriceSimulatorEvent('deterministic/heuristic path - result returned')
      return NextResponse.json({ ok: true, result })
    }

    // Try AI research flow if Genkit is configured; otherwise fallback to heuristic
    try {
      const { z } = await import('genkit')
      // Request the AI with deterministic settings (temperature=0) to reduce output variance
      const ai = await getAi({ modelOptions: { temperature: 0 } })

      const InputSchema = z.object({
        description: z.string().max(1000).optional(),
        type: z.string().optional(),
        location: z.string().optional(),
        clarify: z.any().optional(),
        horasUso: z.number().optional(),
        equipamentoMarca: z.string().optional(),
        equipamentoModelo: z.string().optional(),
        area: z.number().optional(),
        quantity: z.number().optional(),
      })
      // Output supports single estimate + optional scenarios (min/intermediate/max) and optional compressed sources
      const BreakdownItem = z.object({ label: z.string(), amount: z.number() })
      const Scenario = z.object({ name: z.string(), estimate: z.number(), breakdown: z.array(BreakdownItem) })
      const SourceItem = z.object({ title: z.string(), url: z.string().optional(), snippet: z.string().optional(), relevance: z.number().optional() })
      const OutputSchema = z.object({ estimate: z.number(), currency: z.string(), breakdown: z.array(BreakdownItem), scenarios: z.array(Scenario).optional(), sources: z.array(SourceItem).optional(), source: z.string().optional() })

      const prompt = ai.definePrompt({
        name: 'priceResearchPrompt',
        input: { schema: InputSchema },
        output: { schema: OutputSchema },
        prompt: `Você é um assistente técnico que pesquisa preços aproximados de peças e serviços no Brasil (BRL).

    ATENÇÃO: todas as solicitações tratadas por este endpoint são relacionadas a supermercados varejistas (supermercados, mercearias, lojas de varejo alimentar). Considere restrições operacionais típicas de supermercados: necessidades de refrigeração, horários limitados para intervenções, áreas de atendimento ao cliente, higiene e limpeza, exigência de janelas de trabalho para evitar perda de vendas, e complexidade adicional para atuar em ambientes com câmaras frias e linhas de frio.

    Dada a descrição do equipamento/peça e o contexto, faça uma breve pesquisa e retorne APENAS um JSON com os campos: estimate (número), currency ("BRL"), breakdown (lista de {label, amount}).

    Se possível, retorne também até 3 cenários sob a chave 'scenarios': uma versão de menor custo (name: "low"), uma intermediária (name: "mid") e uma maximal/mais conservadora (name: "high"). Cada 'scenario' deve conter 'estimate' e 'breakdown'.

    Inclua opcionalmente uma chave 'sources' com até 5 fontes relevantes (título, url quando aplicável, um pequeno trecho/snippet e um score de relevância entre 0 e 1). As fontes devem ser específicas ao contexto informado (local, complexidade, área, qualidade do material) e devem prover evidência ou exemplos de preços/tabelas que sustentem a estimativa. Forneça trechos curtos (1-2 frases) e não URLs longas.

    Se não houver dados, devolva um número aproximado e marque no breakdown o item 'fonte' com valor 0 e inclua 'heurística' no source.

    Descrição: {{{description}}}
    Tipo: {{{type}}}
    Local: {{{location}}}
    Clarificações (se fornecidas): {{{clarify}}}
    Clarificações (se fornecidas): {{{clarify}}}

    Retorne apenas o JSON válido conforme o schema.`,
      })

      const flow = ai.defineFlow(
        { name: 'priceResearchFlow', inputSchema: InputSchema, outputSchema: OutputSchema },
        async (inputData: any) => {
          // Use shorter retry/timeouts in development to fail fast and fall back to heuristic
          const isProd = process.env.NODE_ENV === 'production'
          // In development be slightly more permissive to avoid immediate fallbacks
          const attempts = isProd ? 3 : 2
          const baseDelay = isProd ? 500 : 300
          const callTimeoutMs = isProd ? 15000 : 10000

          const { output } = await callWithRetries(() => prompt(inputData as any), attempts, baseDelay, callTimeoutMs)
          return output!
        }
      )

      console.debug('Price simulator: calling AI flow for price research (temperature=0)')
      // Pass clarify object through to AI so it can use the extra answers when available
      // Pass structured context to AI. Stringify clarify to ensure templates receive readable text when it's an object.
      const aiInput = {
        description: input.description ?? '',
        type: input.type ?? '',
        location: input.location ?? '',
        clarify: input.clarify ? (typeof input.clarify === 'string' ? input.clarify : JSON.stringify(input.clarify)) : undefined,
        horasUso: input.horasUso,
        equipamentoMarca: input.equipamentoMarca,
        equipamentoModelo: input.equipamentoModelo,
        area: input.area ?? input.area_m2,
        quantity: input.quantity ?? input.quantidade,
      }
      const aiOutput = await flow(aiInput)
      console.debug('Price simulator: AI output', aiOutput)
      // Ensure BRL currency and rounding
      const roundedBreakdown = (aiOutput.breakdown || []).map((b: any) => ({ label: b.label, amount: Math.round((b.amount || 0) * 100) / 100 }))
      const aiEstimate = Math.round((aiOutput.estimate || 0) * 100) / 100

      // If AI didn't return explicit scenarios, synthesize low/mid/high scenarios from the AI estimate
      let scenarios = Array.isArray(aiOutput.scenarios) ? aiOutput.scenarios : null
      if (!scenarios || scenarios.length === 0) {
        const mid = aiEstimate || 0
        // fallback heuristics for scaling when AI doesn't provide scenarios
        const low = Math.round((mid * 0.8) * 100) / 100
        const high = Math.round((mid * 1.25) * 100) / 100
        const makeScaled = (ratio: number) => {
          if (!mid || mid === 0) return roundedBreakdown
          return roundedBreakdown.map((b: any) => ({ label: b.label, amount: Math.round(b.amount * ratio * 100) / 100 }))
        }
        scenarios = [
          { name: 'low', estimate: low, breakdown: makeScaled(low / (mid || 1)) },
          { name: 'mid', estimate: mid, breakdown: roundedBreakdown },
          { name: 'high', estimate: high, breakdown: makeScaled(high / (mid || 1)) },
        ]
      }

      // include sources from AI output when available
      const sources = Array.isArray(aiOutput.sources) ? aiOutput.sources : []

      // compute suggestedHours: prefer AI-provided, otherwise derive from heuristic/breakdown
      let suggestedHours: number | undefined = undefined
      if (typeof aiOutput.suggestedHours === 'number') {
        suggestedHours = Math.max(0, Math.round(aiOutput.suggestedHours))
      } else {
        // derive reasonable hours from payload and breakdown
        const qty = Math.max(1, Number(input.quantity ?? input.quantidade ?? 1))
        if ((input.type || '').toLowerCase() === 'civil') {
          const area = Number(input.area ?? input.area_m2 ?? 0) || 0
          // per-m2 hour baseline conservative for civil works
          const perM2Hours = 0.6 // ~0.6h per m2 => 20m2 -> 12 hours
          const complexityMultiplier = (input.materialQualidade === 'low' ? 0.9 : input.materialQualidade === 'high' ? 1.15 : 1)
          suggestedHours = Math.max(1, Math.round(area * perM2Hours * complexityMultiplier * qty))
        } else if ((input.type || '').toLowerCase() === 'equipamento') {
          // equipment tasks: assume repair/installation hours based on provided estimativaEquipeHoras or anosUso
          suggestedHours = Math.max(1, Math.round(Number(input.estimativaEquipeHoras ?? 4)))
        } else {
          suggestedHours = Math.max(1, Math.round(Number(input.estimativaEquipeHoras ?? 4)))
        }
      }

      // Compare with heuristic to detect large outliers and blend if necessary
      const heuristic = heuristicEstimate(input)
      const heuristicEstimateValue = heuristic.estimate
      const ratio = heuristicEstimateValue > 0 ? aiEstimate / heuristicEstimateValue : 1
      const OUTLIER_LOW = 0.5
      const OUTLIER_HIGH = 3.0

      if (ratio < OUTLIER_LOW || ratio > OUTLIER_HIGH) {
        console.warn(`Price simulator: AI estimate (${aiEstimate}) deviates from heuristic (${heuristicEstimateValue}) by ratio=${ratio.toFixed(2)}; blending results`)
        // Blend results: weight heuristic more heavily when AI is an outlier
        const blended = Math.round((heuristicEstimateValue * 0.6 + aiEstimate * 0.4) * 100) / 100
        const combinedBreakdown = [
          ...roundedBreakdown,
          { label: 'Heurística de referência', amount: heuristicEstimateValue },
          { label: 'Fonte (blend)', amount: 0 },
        ]
        return NextResponse.json({ ok: true, result: { estimate: blended, currency: 'BRL', breakdown: combinedBreakdown, scenarios, sources, source: 'AI+heurística (blended)', suggestedHours } })
      }

      return NextResponse.json({ ok: true, result: { estimate: aiEstimate, currency: 'BRL', breakdown: roundedBreakdown, scenarios, sources, source: 'AI', suggestedHours } })
    } catch (aiErr: unknown) {
      const aiErrMessage = aiErr instanceof Error
        ? aiErr.message
        : (typeof aiErr === 'string'
          ? aiErr
          : (aiErr && typeof aiErr === 'object')
            ? JSON.stringify(aiErr)
            : String(aiErr))

      await logPriceSimulatorEvent(`AI flow failed, falling back to heuristic: ${aiErrMessage}`)
      // If AI fails or isn't configured, fallback to heuristic
      const result = heuristicEstimate(input)
      return NextResponse.json({ ok: true, result })
    }
  } catch (err: any) {
    const message = err?.message ?? String(err)
    await logPriceSimulatorEvent(`price-simulator POST failure: ${message}`)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, info: 'Price simulator POST endpoint. Send JSON payload.' })
}
