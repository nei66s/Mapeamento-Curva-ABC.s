export const STORE_DATALIST_ID = 'price-simulator-store-cities'
export const HOURS_PER_YEAR = 2000
export const HOURS_PER_DAY = 8

export type FormState = {
  tipo: 'manutencao' | 'equipamento' | 'civil'
  descricao: string
  quantidade: number
  area_m2: number
  complexidade: 'baixa' | 'media' | 'alta'
  cidade: string
  anosUso: number
  equipamentoMarca: string
  equipamentoModelo: string
  materialQualidade: 'low' | 'medium' | 'high'
  precisaAlvara: boolean
  estimativaEquipeHoras: number
}

export const getInitialFormState = (): FormState => ({
  tipo: 'manutencao',
  descricao: '',
  quantidade: 1,
  area_m2: 0,
  complexidade: 'media',
  cidade: '',
  anosUso: 0,
  equipamentoMarca: '',
  equipamentoModelo: '',
  materialQualidade: 'medium',
  precisaAlvara: false,
  estimativaEquipeHoras: 1,
})

export const complexityLabelMap: Record<FormState['complexidade'], string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

const COMPLEXITY_HIGH_KEYWORDS = [
  'nova instalação',
  'instalação',
  'integração',
  'automatiza',
  'automatização',
  'complex',
  'complexa',
  'crítico',
  'implantação',
  'critico',
  'obra',
  'reforma',
  'renovação',
  'industrial',
]

const COMPLEXITY_LOW_KEYWORDS = ['rotina', 'preventiva', 'limpeza', 'corretiva leve', 'inspeção', 'verificação']

export type ComplexitySuggestion = {
  level: FormState['complexidade']
  reason: string
}

export function deriveComplexitySuggestion(description: string): ComplexitySuggestion | null {
  const normalized = (description ?? '').trim().toLowerCase()
  if (!normalized) return null

  const highTrigger = COMPLEXITY_HIGH_KEYWORDS.find((keyword) => normalized.includes(keyword))
  if (highTrigger) {
    return {
      level: 'alta',
      reason: `Descrição menciona "${highTrigger}", que costuma exigir uma complexidade mais alta.`,
    }
  }

  const lowTrigger = COMPLEXITY_LOW_KEYWORDS.find((keyword) => normalized.includes(keyword))
  if (lowTrigger) {
    return {
      level: 'baixa',
      reason: `Termo "${lowTrigger}" indica que o trabalho é mais rotineiro e pode ser classificado como baixa complexidade.`,
    }
  }

  if (normalized.length > 180) {
    return { level: 'alta', reason: 'Texto longo e detalhado sugere um esforço técnico maior.' }
  }

  if (normalized.length < 40) {
    return { level: 'baixa', reason: 'Descrição curta indica serviço padrão/rotina.' }
  }

  return null
}

export type EquipmentSuggestion = {
  keywords: string[]
  title: string
  brands: string[]
  models: string[]
}

export const equipmentCatalog: EquipmentSuggestion[] = [
  {
    keywords: ['masseira', 'massa', 'padeiro', 'batedeira'],
    title: 'Masseira industrial / batedeira pesada',
    brands: ['Masseira ProMix', 'ChefMaster Massa', 'FoodWave Dough'],
    models: ['MX-400', 'DoughTech 12', 'PrimeMixer 60'],
  },
  {
    keywords: ['forno', 'assadeira', 'convecção', 'cozimento'],
    title: 'Forno industrial',
    brands: ['Rational', 'Combisteel', 'Metalúrgica Veloz'],
    models: ['CMX-45', 'BakePro 220', 'ThermoLava 900'],
  },
  {
    keywords: ['compressor', 'ar comprimido', 'pressur'],
    title: 'Compressor de ar',
    brands: ['Atlas Copco', 'Ingersoll Rand', 'Schulz'],
    models: ['GA 22', 'SSR-EP 10', 'StationAir 300'],
  },
  {
    keywords: ['gerador', 'motor', 'grupo gerador'],
    title: 'Gerador / motor diesel',
    brands: ['Caterpillar', 'Cummins', 'Wärtsilä'],
    models: ['C15', 'QSK19', 'V12-2000'],
  },
]

export const defaultEquipmentSuggestion: EquipmentSuggestion = {
  keywords: [],
  title: 'Equipamento industrial genérico',
  brands: ['Caterpillar', 'Atlas Copco', 'Bosch'],
  models: ['X2000', 'Series 77', 'Proline 550'],
}

export const CIVIL_COMMON_ITEMS = [
  { key: 'demolicao', label: 'Demolição / remoção (bota fora)', ratePerM2: 15 },
  { key: 'limpeza', label: 'Limpeza e coleta', ratePerM2: 2 },
  { key: 'transporte', label: 'Transporte / descarte', ratePerM2: 5 },
  { key: 'mao_obra', label: 'Mão de obra – equipe (ex.: 1 dia)', isHours: true, hours: 8, ratePerHour: 60 },
  { key: 'materiais_alvenaria', label: 'Materiais – alvenaria', ratePerM2: 20 },
  { key: 'reboco', label: 'Reboco e revestimento', ratePerM2: 18 },
  { key: 'impermeabilizacao', label: 'Impermeabilização', ratePerM2: 12 },
  { key: 'pintura', label: 'Pintura e acabamento', ratePerM2: 10 },
  { key: 'eletrica', label: 'Serviços elétricos (pontos)', flat: 200 },
  { key: 'hidraulica', label: 'Serviços hidráulicos (pontos)', flat: 200 },
]

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const SAP_HEADER_MAP: Record<FormState['tipo'], string> = {
  manutencao: 'REQUISIÇÃO DE SERVIÇOS DE MANUTENÇÃO PREVENTIVA/ALTA DISPONIBILIDADE – ABNT NBR 5674',
  equipamento: 'COMPRA/LOCACÃO DE EQUIPAMENTO ESPECIALIZADO – ABNT NBR 15220',
  civil: 'REQUISIÇÃO DE OBRAS E SERVIÇOS CIVIS – ABNT NBR 16280 / 15575',
}

export const SAP_JUSTIFICATION_MAP: Record<FormState['tipo'], string> = {
  manutencao:
    'Atende requisitos da ABNT NBR 5674 ao garantir disponibilidade operacional e segurança dos ativos críticos; o valor cobre horas de terceiros e materiais de reposição.',
  equipamento:
    'Atende ABNT NBR 15220 ao justificar aquisição/locação especializada para manter confiabilidade das linhas produtivas; embasa investimento com base no desgaste identificado.',
  civil:
    'Alinha-se à ABNT NBR 16280 e 15575, reforçando a necessidade de obras/adequações estruturais para conformidade e segurança dos ambientes operacionais.',
}
