export const impactFactors = [
  {
    id: 'safety',
    label: 'Segurança',
    description: 'Risco de acidentes, lesões ou fatalidades para colaboradores ou clientes.',
  },
  {
    id: 'sales',
    label: 'Produção/Vendas',
    description: 'Impacto direto na capacidade de produzir, vender ou na experiência de compra do cliente.',
  },
  {
    id: 'legal',
    label: 'Legal/Normativo',
    description: 'Risco de multas, sanções ou não conformidade com regulamentações.',
  },
  {
    id: 'brand',
    label: 'Imagem da Marca',
    description: 'Impacto negativo na percepção pública e na reputação da marca.',
  },
  {
    id: 'cost',
    label: 'Custo de Reparo',
    description: 'Custo financeiro elevado para reparo ou substituição do item.',
  },
] as const;

export type ImpactFactor = (typeof impactFactors)[number];
