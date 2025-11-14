#!/usr/bin/env ts-node
import { format, subDays } from 'date-fns';
import pool from '../src/lib/db';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed(inferior = 200, entre = 200) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    const today = new Date();

    // inferior_30: 0..29 days
    for (let i = 0; i < inferior; i++) {
      const ageDays = randInt(0, 29);
      const dl = subDays(today, ageDays);
      const dv = subDays(dl, -7);
      const tipo = Math.random() > 0.5 ? 'DEBIT' : 'CREDIT';
      const statusRoll = Math.random();
      const status = statusRoll < 0.7 ? 'PENDENTE' : statusRoll < 0.95 ? 'PAGO' : 'CANCELADO';
      const valor = (Math.random() * 10000 + 10).toFixed(2);
      const descricao = `Seed target inferior_30 ${format(dl, 'yyyy-MM-dd')}`;
      const sql = `
        INSERT INTO public.lancamentos_mensais (
          id, conta_id, categoria_id, tipo, descricao, valor, moeda,
          data_lancamento, data_vencimento, recorrente, status, metadata, created_by, referencia
        ) VALUES (
          gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $1, $2, $3, 'BRL', $4, $5, false, $6, $7::jsonb, gen_random_uuid(), $8
        )
      `;
      const meta = JSON.stringify({ seed: true, bucket: 'inferior_30' });
      await client.query(sql, [tipo, descricao, valor, format(dl, 'yyyy-MM-dd'), format(dv, 'yyyy-MM-dd'), status, meta, `T-INF-${i}`]);
      total++;
    }

    // entre_30_60: 30..59 days
    for (let i = 0; i < entre; i++) {
      const ageDays = randInt(30, 59);
      const dl = subDays(today, ageDays);
      const dv = subDays(dl, -7);
      const tipo = Math.random() > 0.5 ? 'DEBIT' : 'CREDIT';
      const statusRoll = Math.random();
      const status = statusRoll < 0.7 ? 'PENDENTE' : statusRoll < 0.95 ? 'PAGO' : 'CANCELADO';
      const valor = (Math.random() * 10000 + 10).toFixed(2);
      const descricao = `Seed target entre_30_60 ${format(dl, 'yyyy-MM-dd')}`;
      const sql = `
        INSERT INTO public.lancamentos_mensais (
          id, conta_id, categoria_id, tipo, descricao, valor, moeda,
          data_lancamento, data_vencimento, recorrente, status, metadata, created_by, referencia
        ) VALUES (
          gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $1, $2, $3, 'BRL', $4, $5, false, $6, $7::jsonb, gen_random_uuid(), $8
        )
      `;
      const meta = JSON.stringify({ seed: true, bucket: 'entre_30_60' });
      await client.query(sql, [tipo, descricao, valor, format(dl, 'yyyy-MM-dd'), format(dv, 'yyyy-MM-dd'), status, meta, `T-ENT-${i}`]);
      total++;
    }

    await client.query('COMMIT');
    console.log(`Targeted seed completed: ${total} records inserted (inferior=${inferior}, entre=${entre})`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro durante seed targeted:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  // Require explicit confirmation to run demo seeds to avoid accidental use in production
  const allowDemo = process.env.ALLOW_DEMO_SEEDS === '1' || argv.includes('--demo');
  if (!allowDemo) {
    console.log('Demo seed skipped: set ALLOW_DEMO_SEEDS=1 or pass --demo to run this script.');
    process.exit(0);
  }
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
  const inferior = Number(args.inferior || '200');
  const entre = Number(args.entre || '200');
  await seed(inferior, entre);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
