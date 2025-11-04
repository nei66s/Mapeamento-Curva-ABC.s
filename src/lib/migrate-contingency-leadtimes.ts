import pool from './db';

const contingencyPlans = [
  "Acionar equipe de manutenção interna.",
  "Contratar serviço de locação de equipamento similar.",
  "Isolar a área e aguardar o técnico especialista.",
  "Utilizar equipamento reserva.",
  "Redirecionar fluxo de clientes.",
  "Iniciar operação em modo de contingência manual."
];

const leadTimes = [
  "Imediato",
  "2 horas",
  "4 horas",
  "8 horas",
  "24 horas",
  "48 horas"
];

async function migrate() {
  for (const description of contingencyPlans) {
    await pool.query(
      'INSERT INTO contingency_plans (description) VALUES ($1) ON CONFLICT (description) DO NOTHING',
      [description]
    );
    console.log(`Plano de contingência '${description}' migrado.`);
  }

  for (const description of leadTimes) {
    await pool.query(
      'INSERT INTO lead_times (description) VALUES ($1) ON CONFLICT (description) DO NOTHING',
      [description]
    );
    console.log(`Lead time '${description}' migrado.`);
  }

  await pool.end();
  console.log('Migração de planos de contingência e lead times concluída.');
}

migrate().catch(console.error);
