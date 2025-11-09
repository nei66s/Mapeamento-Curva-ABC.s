#!/usr/bin/env node
// Script para inserir items de teste no banco usando node + pg
// Uso: ajustar variáveis de ambiente PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE e rodar:
//   node .\scripts\seed-items.js

const { Pool } = require('pg');

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

const password = process.env.PGPASSWORD || parseArg('--password');
if (!password) {
  console.error('ERRO: senha não fornecida. Defina PGPASSWORD ou passe --password');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password,
  database: process.env.PGDATABASE || 'postgres',
});

const sql = `
INSERT INTO items (name, category_id, classification, impact_factors, status, contingency_plan, lead_time, image_url) VALUES
  ('Monitoramento NVR Primário', (SELECT id FROM categories WHERE name='Segurança / CFTV / Alarme'), 'A', '["safety","brand"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '2 horas', 'https://picsum.photos/seed/item10/200/120'),
  ('Câmera Caixa Interna', (SELECT id FROM categories WHERE name='Segurança / CFTV / Alarme'), 'B', '["safety"]'::jsonb, 'online', 'Acionar equipe de manutenção interna.', '4 horas', 'https://picsum.photos/seed/item11/200/120'),
  ('Iluminação Emergência', (SELECT id FROM categories WHERE name='Elétrica / Iluminação'), 'A', '["safety","legal"]'::jsonb, 'online', 'Isolar a área e aguardar o técnico especialista.', 'Imediato', 'https://picsum.photos/seed/item12/200/120'),
  ('Painel Elétrico Auxiliar', (SELECT id FROM categories WHERE name='Elétrica / Iluminação'), 'B', '["cost","sales"]'::jsonb, 'online', 'Contratar serviço de locação de equipamento similar.', '24 horas', 'https://picsum.photos/seed/item13/200/120'),
  ('Freezer Expositor 2 portas', (SELECT id FROM categories WHERE name='Refrigeração / Climatização Central'), 'A', '["sales","cost"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '8 horas', 'https://picsum.photos/seed/item14/200/120'),
  ('Evaporador Reserva', (SELECT id FROM categories WHERE name='Refrigeração / Climatização Central'), 'B', '["sales"]'::jsonb, 'offline', 'Acionar equipe de manutenção interna.', '48 horas', 'https://picsum.photos/seed/item15/200/120'),
  ('Forno Padaria Industrial', (SELECT id FROM categories WHERE name='Padaria / Confeitaria'), 'A', '["sales","cost"]'::jsonb, 'online', 'Contratar serviço de locação de equipamento similar.', '24 horas', 'https://picsum.photos/seed/item16/200/120'),
  ('Balcão Refrigerado Hortifrúti', (SELECT id FROM categories WHERE name='Hortifrúti / Floricultura'), 'B', '["sales"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '4 horas', 'https://picsum.photos/seed/item17/200/120'),
  ('Sistema de Backup de Energia', (SELECT id FROM categories WHERE name='Energização / Geradores / Nobreaks'), 'A', '["safety","sales","cost"]'::jsonb, 'online', 'Utilizar equipamento reserva.', '2 horas', 'https://picsum.photos/seed/item18/200/120'),
  ('Corta-corrente Estacionamento', (SELECT id FROM categories WHERE name='Estacionamento / Acessos / Cancelas'), 'C', '["brand"]'::jsonb, 'offline', 'Redirecionar fluxo de clientes.', '48 horas', 'https://picsum.photos/seed/item19/200/120'),
  ('Máquina de Café Refeitório', (SELECT id FROM categories WHERE name='Refeitório / Vestiários / Áreas de Apoio ao Colaborador'), 'C', '["cost"]'::jsonb, 'offline', 'Iniciar operação em modo de contingência manual.', '48 horas', 'https://picsum.photos/seed/item20/200/120'),
  ('Painel Decorativo LED', (SELECT id FROM categories WHERE name='Logo/ Painéis / Iluminação decorativa'), 'C', '["brand"]'::jsonb, 'online', 'Isolar a área e aguardar o técnico especialista.', '24 horas', 'https://picsum.photos/seed/item21/200/120')
ON CONFLICT (name) DO UPDATE SET
  category_id = COALESCE(EXCLUDED.category_id, items.category_id),
  classification = COALESCE(EXCLUDED.classification, items.classification),
  impact_factors = COALESCE(EXCLUDED.impact_factors, items.impact_factors),
  status = COALESCE(EXCLUDED.status, items.status),
  contingency_plan = COALESCE(EXCLUDED.contingency_plan, items.contingency_plan),
  lead_time = COALESCE(EXCLUDED.lead_time, items.lead_time),
  image_url = COALESCE(EXCLUDED.image_url, items.image_url);
`;

async function run() {
  console.log('Conectando ao banco...');
  try {
    const res = await pool.query(sql);
    console.log('INSERT executado com sucesso.');
    // res.rowCount is likely 0 for multi-row inserts with ON CONFLICT DO UPDATE
    console.log('Resultado:', { rowCount: res.rowCount });
  } catch (err) {
    console.error('Erro ao executar INSERTs:', err.message || err);
    process.exitCode = 2;
  } finally {
    await pool.end();
    console.log('Conexão encerrada.');
  }
}

run();
