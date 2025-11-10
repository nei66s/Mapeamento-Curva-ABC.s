#!/usr/bin/env ts-node
import { parseISO, addMonths, addDays, format } from 'date-fns';
import pool from '../src/lib/db';

// Gera lançamentos sintéticos na tabela public.lancamentos_mensais
async function seed(start = '2025-01-01', months = 6, perMonth = 100) {
  const startDate = parseISO(start);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    for (let m = 0; m < months; m++) {
      const monthDate = addMonths(startDate, m);
      for (let i = 0; i < perMonth; i++) {
        const dl = addDays(monthDate, i % 28); // data_lancamento within month
        const dv = addDays(dl, 7);
        const tipo = Math.random() > 0.5 ? 'DEBIT' : 'CREDIT';
        const statusRoll = Math.random();
        const status = statusRoll < 0.7 ? 'PENDENTE' : statusRoll < 0.95 ? 'PAGO' : 'CANCELADO';
        const valor = (Math.random() * 10000 + 10).toFixed(2);
        const descricao = `Teste seed ${format(dl, 'yyyy-MM')}-${i}`;
        const sql = `
          INSERT INTO public.lancamentos_mensais (
            id, conta_id, categoria_id, tipo, descricao, valor, moeda,
            data_lancamento, data_vencimento, recorrente, status, metadata, created_by, referencia
          ) VALUES (
            gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $1, $2, $3, 'BRL', $4, $5, false, $6, $7::jsonb, gen_random_uuid(), $8
          )
        `;
        const meta = JSON.stringify({ seed: true, src: 'scripts/seed-lancamentos' });
        await client.query(sql, [tipo, descricao, valor, format(dl, 'yyyy-MM-dd'), format(dv, 'yyyy-MM-dd'), status, meta, `REF-${m}-${i}`]);
        total++;
      }
    }
    await client.query('COMMIT');
    console.log(`Seed completado: ${total} registros inseridos (start=${start}, months=${months}, perMonth=${perMonth})`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro durante seed:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.replace(/^--/, '');
      const v = argv[i + 1];
      args[k] = v;
      i++;
    }
  }
  const start = args.start || '2025-01-01';
  const months = Number(args.months || '6');
  const perMonth = Number(args.perMonth || '100');
  await seed(start, months, perMonth);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
