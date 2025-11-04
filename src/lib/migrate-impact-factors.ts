import pool from './db';

const impactFactors = [
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
];

async function migrate() {
  for (const factor of impactFactors) {
    await pool.query(
      'INSERT INTO impact_factors (id, label, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [factor.id, factor.label, factor.description]
    );
    console.log(`Impact factor ${factor.label} migrado.`);
  }
  await pool.end();
  console.log('Migração de impact factors concluída.');
}

migrate().catch(console.error);
