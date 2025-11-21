export type SimulatorInput = {
  type?: string
  description?: string
  location?: string
  area?: number
  horasUso?: number
  equipamentoMarca?: string
  equipamentoModelo?: string
  materialQualidade?: 'low' | 'medium' | 'high'
  precisaAlvara?: boolean
  estimativaEquipeHoras?: number
  // common aliases and extra fields passed from client
  quantity?: number
  quantidade?: number
  area_m2?: number
  clarify?: any
  // when true, prefer deterministic heuristic instead of calling AI
  deterministic?: boolean
  forceHeuristic?: boolean
}

type RawPayload = Record<string, any>

export function normalizeIncoming(body: RawPayload): SimulatorInput {
  return {
    type: body.type ?? body.tipo ?? body.tipo_servico,
    description: body.description ?? body.descricao ?? body.description_text,
    location: body.location ?? body.cidade ?? body.city,
    area: body.area ?? body.area_m2 ?? body.area_m,
    area_m2: body.area_m2 ?? body.area ?? undefined,
    horasUso: body.horasUso ?? body.horas ?? body.uso_horas,
    equipamentoMarca: body.equipamentoMarca ?? body.marca ?? body.brand,
    equipamentoModelo: body.equipamentoModelo ?? body.modelo ?? body.model,
    materialQualidade: (body.materialQualidade ?? body.qualidade ?? body.complexidade) as any,
    precisaAlvara: body.precisaAlvara ?? body.alvara ?? body.needs_license,
    estimativaEquipeHoras: body.estimativaEquipeHoras ?? body.horas_estimadas ?? body.quantidade,
    // aliases
    quantity: body.quantity ?? body.quantidade ?? undefined,
    quantidade: body.quantidade ?? body.quantity ?? undefined,
    // pass-through for clarify/clarifications from client modal
    clarify: body.clarify ?? body.clarificacoes ?? body.clarifyAnswers ?? undefined,
    deterministic: body.deterministic === true || body.deterministic === 'true' || body.deterministic === 1 || body.deterministic === '1',
    forceHeuristic: body.forceHeuristic === true || body.forceHeuristic === 'true' || body.forceHeuristic === 1 || body.forceHeuristic === '1',
  }
}

export function buildNanoBananaPrompt(input: SimulatorInput): string {
  const lines = [
    'Gere uma planta baixa estilizada em PNG com base nas informações abaixo.',
    `Tipo de serviço: ${input.type ?? 'não informado'}.`,
    `Descrição técnica: ${input.description ?? 'sem descrição'}.`,
    `Localização/cidade: ${input.location ?? 'não informado'}.`,
    input.area ? `Área aproximada: ${input.area} m².` : null,
    input.horasUso ? `Horas de uso acumuladas (ou equivalente): ${input.horasUso}.` : null,
    input.equipamentoMarca ? `Marca do equipamento envolvido: ${input.equipamentoMarca}.` : null,
    input.equipamentoModelo ? `Modelo especificado: ${input.equipamentoModelo}.` : null,
    input.materialQualidade ? `Indicador de qualidade dos materiais: ${input.materialQualidade}.` : null,
    input.precisaAlvara ? 'Necessita alvará ou licença especial.' : null,
    'Inclua elementos de referência como paredes, portas e equipamentos principais, destacando o fluxo de trabalho.',
    'Use tons neutros e rostos técnicos, mantendo dimensões proporcionais.',
  ]
  return lines.filter(Boolean).join(' ')
}
