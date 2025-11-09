#!/usr/bin/env ts-node
import pool from '../src/lib/db';

async function main() {
  try {
    const res = await pool.query(`
      SELECT to_char(data_lancamento, 'YYYY-MM') as mes,
             count(*) as total,
             count(*) FILTER (WHERE status = 'PAGO') as pagos,
             count(*) FILTER (WHERE status = 'PENDENTE') as pendentes,
             coalesce(sum(valor),0) as soma_valor
      FROM public.indicadores_lancamentos
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT 24
    `);
    console.log('Aggregated indicadores_lancamentos (most recent 24 months):');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error querying indicadores_lancamentos:', err);
    process.exit(1);
  }
}

main();
