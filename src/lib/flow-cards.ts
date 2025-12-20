export type FlowModuleCard = {
  id: string;
  label: string;
  description: string;
  link: string;
  accent: string;
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel?: string;
  secondaryValue?: number;
  detail?: string;
  meta?: string;
};

export type FlowCardsResponse = {
  cards: FlowModuleCard[];
  totalActivities: number;
  updatedAt: string;
};
