export type SeasonSnapshot = {
  seasonLabel: string;
  seasonNote: string;
  activeEvent: SeasonEvent | null;
  theme: SeasonTheme;
};

export type SeasonEvent = {
  name: string;
  description: string;
  impact: string;
  start: { month: number; day: number };
  end: { month: number; day: number };
  regions?: string[];
};

export type SeasonTheme = {
  emoji: string;
  backgroundClass: string;
  borderClass: string;
  textClass: string;
  accentText: string;
  eventEmoji?: string;
  primary?: string;
  primaryForeground?: string;
  background?: string;
  foreground?: string;
  card?: string;
  cardForeground?: string;
  muted?: string;
  mutedForeground?: string;
  heroFrom?: string;
  heroVia?: string;
  heroTo?: string;
  border?: string;
  ring?: string;
};

const seasons = [
  {
    label: 'Verão',
    months: [12, 1, 2],
    note: 'Temporada de calor e operação intensa, especialmente para refrigeração e ar-condicionado.',
  },
  {
    label: 'Outono',
    months: [3, 4, 5],
    note: 'Transição para temperaturas mais amenas; bom momento para revisar ativos antes do inverno.',
  },
  {
    label: 'Inverno',
    months: [6, 7, 8],
    note: 'Frio e umidade exigem atenção extra em sistemas de climatização, aquecimento e fachadas.',
  },
  {
    label: 'Primavera',
    months: [9, 10, 11],
    note: 'Reaberturas, feiras e feriados aumentam o desgaste; planeje estoque e equipes extras.',
  },
];

const seasonalEvents: SeasonEvent[] = [
  {
    name: 'Carnaval & Pré-carnaval',
    description: 'Picos de consumo e alta ocupação exigem estabilidade em refrigeração e redes elétricas.',
    impact: 'Aumente inspeções preventivas e monitore sistemas críticos de alimentação.',
    start: { month: 2, day: 1 },
    end: { month: 2, day: 28 },
    regions: ['sudeste', 'centro-oeste', 'sul'],
  },
  {
    name: 'Semana Santa',
    description: 'Longo feriado com grande circulação logística e impacto sobre transporte e energia.',
    impact: 'Mantenha equipes de plantão e redundância em geradores e iluminação.',
    start: { month: 3, day: 20 },
    end: { month: 4, day: 10 },
    regions: ['sudeste', 'nordeste', 'sul'],
  },
  {
    name: 'Outubro Rosa / Governo',
    description: 'Campanhas e eventos regionais aumentam fluxo de pessoas e responsabilidades prediais.',
    impact: 'Garanta HVAC estável e limpezas extras em espaços comuns.',
    start: { month: 10, day: 1 },
    end: { month: 10, day: 31 },
    regions: ['sudeste', 'sul'],
  },
  {
    name: 'Black Friday & Cyber Week',
    description: 'Logística operando no limite. Centros de distribuição e lojas físicas sofrem mais desgaste.',
    impact: 'Reforce SLAs de manutenção corretiva e planos de contingência.',
    start: { month: 11, day: 15 },
    end: { month: 11, day: 30 },
  },
  {
    name: 'Natal & Réveillon',
    description: 'Alta de compras e operação 24/7 em varejo; risco de equipamentos críticos falharem.',
    impact: 'Garanta estoque de peças, previsão de horas extras e monitoramento em tempo real.',
    start: { month: 12, day: 15 },
    end: { month: 1, day: 5 },
  },
];

const holidayEvents: SeasonEvent[] = [
  {
    name: 'Confraternização Universal',
    description: 'Feriado nacional no início do ano com baixa operação e manutenção programada.',
    impact: 'Reserve equipe de plantão e priorize equipamentos que já vinham com avisos.',
    start: { month: 1, day: 1 },
    end: { month: 1, day: 2 },
  },
  {
    name: 'Tiradentes',
    description: 'Feriado prolongado em abril que exige atenção a prédios comerciais e operações críticas.',
    impact: 'Monitore geradores e iluminação de emergência.',
    start: { month: 4, day: 21 },
    end: { month: 4, day: 22 },
  },
  {
    name: 'Dia do Trabalho',
    description: '1º de maio tem impacto logístico por folgas estendidas.',
    impact: 'Avalie guias de serviço e equipes de suporte.',
    start: { month: 5, day: 1 },
    end: { month: 5, day: 2 },
  },
  {
    name: 'Independência do Brasil',
    description: 'Picos de deslocamento e consumo no comércio.',
    impact: 'Verifique sistemas de ar e segurança.',
    start: { month: 9, day: 7 },
    end: { month: 9, day: 8 },
  },
];

const seasonThemes: Record<string, SeasonTheme> = {
  Verão: {
    emoji: '🌞',
    backgroundClass: 'bg-gradient-to-r from-orange-50 via-amber-50 to-pink-50',
    borderClass: 'border-orange-200',
    textClass: 'text-slate-900',
    accentText: 'Calor intenso / refrigeração ativa',
    primary: '28 98% 58%',
    primaryForeground: '0 0% 100%',
    background: '25 98% 95%',
    foreground: '25 20% 20%',
    card: '25 96% 100%',
    cardForeground: '25 20% 15%',
    muted: '30 60% 90%',
    mutedForeground: '0 0% 20%',
    heroFrom: '28 90% 92%',
    heroVia: '30 85% 78%',
    heroTo: '10 78% 60%',
    border: '28 90% 70%',
    ring: '28 100% 60%',
  },
  Outono: {
    emoji: '🍂',
    backgroundClass: 'bg-gradient-to-r from-slate-50 via-amber-50 to-orange-50',
    borderClass: 'border-amber-200',
    textClass: 'text-slate-900',
    accentText: 'Transição e manutenção preventiva em destaque',
    primary: '32 90% 60%',
    primaryForeground: '0 0% 4%',
    background: '30 94% 98%',
    foreground: '30 15% 20%',
    card: '30 96% 98%',
    cardForeground: '30 15% 15%',
    muted: '32 40% 92%',
    mutedForeground: '0 0% 25%',
    heroFrom: '36 40% 94%',
    heroVia: '36 60% 85%',
    heroTo: '28 52% 70%',
    border: '32 70% 68%',
    ring: '32 100% 60%',
  },
  Inverno: {
    emoji: '❄️',
    backgroundClass: 'bg-gradient-to-r from-slate-100 via-slate-200 to-blue-100',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-900',
    accentText: 'Foco em climatização e fachadas',
    primary: '210 30% 75%',
    primaryForeground: '210 20% 98%',
    background: '210 10% 97%',
    foreground: '210 25% 18%',
    card: '210 15% 95%',
    cardForeground: '210 10% 20%',
    muted: '210 15% 90%',
    mutedForeground: '210 15% 30%',
    heroFrom: '210 20% 95%',
    heroVia: '215 25% 90%',
    heroTo: '210 30% 80%',
    border: '215 20% 60%',
    ring: '210 100% 70%',
  },
  Primavera: {
    emoji: '🌸',
    backgroundClass: 'bg-gradient-to-r from-lime-50 via-cyan-50 to-fuchsia-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-slate-900',
    accentText: 'Reaberturas e eventos aumentam desgaste',
    primary: '154 60% 45%',
    primaryForeground: '0 0% 98%',
    background: '150 44% 95%',
    foreground: '160 30% 18%',
    card: '150 55% 95%',
    cardForeground: '150 40% 20%',
    muted: '160 45% 90%',
    mutedForeground: '0 0% 30%',
    heroFrom: '160 40% 95%',
    heroVia: '170 55% 85%',
    heroTo: '320 50% 75%',
    border: '150 60% 60%',
    ring: '150 90% 60%',
  },
};

const eventThemes: Record<string, Partial<SeasonTheme>> = {
  'Black Friday & Cyber Week': {
    emoji: '🛍️',
    backgroundClass: 'bg-gradient-to-r from-slate-900 via-slate-700 to-emerald-900',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-100',
    accentText: 'Alta pressão logística e equipamentos',
    eventEmoji: '🛒',
    primary: '210 20% 10%',
    primaryForeground: '0 0% 98%',
    muted: '210 25% 20%',
    heroFrom: '240 20% 10%',
    heroVia: '220 25% 15%',
    heroTo: '180 40% 20%',
    border: '0 0% 20%',
    ring: '0 0% 75%',
  },
  'Natal & Réveillon': {
    emoji: '🎄',
    backgroundClass: 'bg-gradient-to-r from-red-50 via-red-100 to-rose-200',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-900',
    accentText: 'Operação contínua em varejo',
    eventEmoji: '🎁',
    primary: '350 80% 50%',
    primaryForeground: '0 0% 100%',
    muted: '350 50% 95%',
    mutedForeground: '0 0% 30%',
    heroFrom: '350 55% 90%',
    heroVia: '350 60% 78%',
    heroTo: '5 80% 65%',
    border: '350 70% 60%',
    ring: '350 100% 65%',
  },
  'Carnaval & Pré-carnaval': {
    emoji: '🎭',
    backgroundClass: 'bg-gradient-to-r from-pink-50 via-amber-50 to-yellow-100',
    borderClass: 'border-fuchsia-300',
    textClass: 'text-slate-900',
    accentText: 'Eventos e rua demandam energia',
    eventEmoji: '🎉',
    primary: '330 90% 65%',
    primaryForeground: '0 0% 100%',
    muted: '330 65% 95%',
    mutedForeground: '0 0% 25%',
    heroFrom: '330 60% 95%',
    heroVia: '20 80% 85%',
    heroTo: '40 90% 75%',
    border: '330 80% 60%',
    ring: '330 100% 70%',
    foreground: '330 30% 18%',
    cardForeground: '0 0% 20%',
    background: '318 90% 95%',
  },
};

function baseThemeForSeason(label: string): SeasonTheme {
  return seasonThemes[label] ?? seasonThemes['Primavera'];
}

function mergeThemeOverrides(base: SeasonTheme, event: SeasonEvent): SeasonTheme {
  const overrides = eventThemes[event.name];
  if (!overrides) return base;
  return { ...base, ...overrides };
}

function monthDayNumber(date: Date) {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function isWithinRange(
  date: Date,
  start: { month: number; day: number },
  end: { month: number; day: number }
) {
  const value = monthDayNumber(date);
  const startValue = start.month * 100 + start.day;
  const endValue = end.month * 100 + end.day;
  if (startValue <= endValue) {
    return value >= startValue && value <= endValue;
  }
  return value >= startValue || value <= endValue;
}

export function getSeasonSnapshot(now = new Date(), region?: string): SeasonSnapshot {
  const month = now.getMonth() + 1;
  const season = seasons.find(s => s.months.includes(month)) ?? seasons[0];
  const candidates = [...seasonalEvents, ...holidayEvents];
  const event =
    candidates.find(evt => {
      if (region && evt.regions && !evt.regions.includes(region)) return false;
      return isWithinRange(now, evt.start, evt.end);
    }) ??
    null;

  const baseTheme = baseThemeForSeason(season.label);
  const theme = event ? mergeThemeOverrides(baseTheme, event) : baseTheme;

  return {
    seasonLabel: season.label,
    seasonNote: season.note,
    activeEvent: event,
    theme,
  };
}
