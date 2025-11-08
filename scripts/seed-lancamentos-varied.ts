#!/usr/bin/env ts-node
import { format, subDays } from 'date-fns';
import pool from '../src/lib/db';

// Seeder that distributes data across age buckets so aging tests are meaningful.
// Usage: npx ts-node scripts/seed-lancamentos-varied.ts --months 6 --perMonth 200

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed(months = 6, perMonth = 100) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    const today = new Date();

    // age buckets ranges in days
    const buckets = [
      { name: 'inferior_30', min: 0, max: 29 },
      { name: 'entre_30_60', min: 30, max: 59 },
      { name: 'entre_60_90', min: 60, max: 89 },
      { name: 'superior_90', min: 90, max: 150 },
    ];

    for (let m = 0; m < months; m++) {
      for (let i = 0; i < perMonth; i++) {
        // pick random bucket to ensure distribution
        const b = buckets[randInt(0, buckets.length - 1)];
        const ageDays = randInt(b.min, b.max);
        const dl = subDays(today, ageDays);
        const dv = subDays(dl, -7); // 7 days after dl
        const tipo = Math.random() > 0.5 ? 'DEBIT' : 'CREDIT';
        const statusRoll = Math.random();
        const status = statusRoll < 0.7 ? 'PENDENTE' : statusRoll < 0.95 ? 'PAGO' : 'CANCELADO';
        const valor = (Math.random() * 10000 + 10).toFixed(2);
        const descricao = `Seed varied ${format(dl, 'yyyy-MM-dd')}`;
        const sql = `
          INSERT INTO public.lancamentos_mensais (
            id, conta_id, categoria_id, tipo, descricao, valor, moeda,
            data_lancamento, data_vencimento, recorrente, status, metadata, created_by, referencia
          ) VALUES (
            gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $1, $2, $3, 'BRL', $4, $5, false, $6, $7::jsonb, gen_random_uuid(), $8
          )
        `;
        const meta = JSON.stringify({ seed: true, bucket: b.name });
        await client.query(sql, [tipo, descricao, valor, format(dl, 'yyyy-MM-dd'), format(dv, 'yyyy-MM-dd'), status, meta, `VAR-${m}-${i}`]);
        total++;
      }
    }

    await client.query('COMMIT');
    console.log(`Seed varied completado: ${total} registros inseridos (months=${months}, perMonth=${perMonth})`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro durante seed varied:', err);
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
  const months = Number(args.months || '6');
  const perMonth = Number(args.perMonth || '100');
  await seed(months, perMonth);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
