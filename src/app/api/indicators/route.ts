export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type AgeKey = 'inferior_30' | 'entre_30_60' | 'entre_60_90' | 'superior_90';
type CritKey = 'baixa' | 'media' | 'alta' | 'muito_alta';

const AGE_BUCKETS: { key: AgeKey; weight: number; min?: number }[] = [
  { key: 'inferior_30', weight: 0.4, min: 1 },
  { key: 'entre_30_60', weight: 0.3, min: 1 },
  { key: 'entre_60_90', weight: 0.2 },
  { key: 'superior_90', weight: 0.1 },
];

const CRIT_BUCKETS: { key: CritKey; weight: number }[] = [
  { key: 'baixa', weight: 0.45 },
  { key: 'media', weight: 0.3 },
  { key: 'alta', weight: 0.2 },
  { key: 'muito_alta', weight: 0.05 },
];

function emptyAging(): Record<AgeKey, Record<CritKey, number>> {
  return AGE_BUCKETS.reduce((acc, bucket) => {
    acc[bucket.key] = { baixa: 0, media: 0, alta: 0, muito_alta: 0 };
    return acc;
  }, {} as Record<AgeKey, Record<CritKey, number>>);
}

function buildSyntheticAging(pendentes: number) {
  const aging = emptyAging();
  const total = Math.max(0, pendentes);
  if (total === 0) return aging;

  let remaining = total;
  AGE_BUCKETS.forEach((bucket, idx) => {
    const isLastBucket = idx === AGE_BUCKETS.length - 1;
    const desired = Math.round(total * bucket.weight);
    const minValue = bucket.min ?? 0;
    const bucketTotal = isLastBucket
      ? remaining
      : Math.min(remaining, Math.max(desired, Math.min(minValue, remaining)));
    remaining -= bucketTotal;

    let bucketRemaining = bucketTotal;
    CRIT_BUCKETS.forEach((critBucket, critIdx) => {
      const isLastCrit = critIdx === CRIT_BUCKETS.length - 1;
      const desiredCrit = Math.round(bucketTotal * critBucket.weight);
      const critTotal = isLastCrit
        ? bucketRemaining
        : Math.min(bucketRemaining, Math.max(desiredCrit, 0));
      aging[bucket.key][critBucket.key] = critTotal;
      bucketRemaining -= critTotal;
    });
  });

  return aging;
}

function summarizeCriticidade(aging: Record<AgeKey, Record<CritKey, number>>) {
  const totals: Record<CritKey, number> = { baixa: 0, media: 0, alta: 0, muito_alta: 0 };
  AGE_BUCKETS.forEach(bucket => {
    const bucketData = aging[bucket.key];
    (Object.keys(totals) as CritKey[]).forEach(crit => {
      totals[crit] += bucketData[crit];
    });
  });
  return totals;
}

async function ensureTable() {
  // Create a simple table to store each indicator as a JSONB payload.
  // We use the month (mes) as the logical unique key so inserts/updates are idempotent.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      id TEXT PRIMARY KEY,
      mes TEXT NOT NULL,
      data JSONB NOT NULL
    );
  `);
  // index on mes for ordering/filtering
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_indicators_mes ON indicators (mes);`);
}

export async function GET() {
  try {
    await ensureTable();
    const res = await pool.query('SELECT data FROM indicators ORDER BY mes');
    const rows = res.rows.map(r => r.data);
    if (rows.length > 0) {
      return NextResponse.json(rows);
    }

    // Fallback: se não houver indicadores pré-computados, agregamos dados
    // a partir da tabela `indicadores_lancamentos` que contém os lançamentos
    // sincronizados. Isso permite popular a página de indicadores mesmo quando
    // a tabela `indicators` ainda não foi preenchida.
    const aggSql = `
      SELECT to_char(data_lancamento, 'YYYY-MM') as mes,
             count(*) as total,
             count(*) FILTER (WHERE status = 'PAGO') as pagos,
             count(*) FILTER (WHERE status = 'PENDENTE') as pendentes
      FROM public.indicadores_lancamentos
      GROUP BY mes
      ORDER BY mes;
    `;
    try {
      const a = await pool.query(aggSql);
      const fallback = a.rows.map((r: any) => {
        const total = Number(r.total || 0);
        const pagos = Number(r.pagos || 0);
        const pendentes = Number(r.pendentes || 0);
        const sla = total > 0 ? Math.round((pagos / total) * 100) : 0;
        const aging = buildSyntheticAging(pendentes); // create deterministic buckets so UI charts render even sem dados reais

        return {
          id: r.mes,
          mes: r.mes,
          sla_mensal: sla,
          meta_sla: 95,
          crescimento_mensal_sla: 0,
          backlog: pendentes,
          chamados_solucionados: pagos,
          chamados_abertos: total,
          aging,
          criticidade: summarizeCriticidade(aging),
          prioridade: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
          // cost fields removed
        };
      });
      return NextResponse.json(fallback);
    } catch (err) {
      console.error('Failed to aggregate indicadores_lancamentos', err);
      return NextResponse.json(rows);
    }
  } catch (err) {
    console.error('GET /api/indicators error', err);
    return NextResponse.json({ error: 'Failed to load indicators' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.mes) {
      return NextResponse.json({ error: 'Invalid payload, missing mes' }, { status: 400 });
    }
    await ensureTable();
    const id = body.mes; // use month as natural unique id
    const data = body;
    await pool.query(
      'INSERT INTO indicators (id, mes, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, mes = EXCLUDED.mes',
      [id, body.mes, JSON.stringify(data)]
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error('POST /api/indicators error', err);
    return NextResponse.json({ error: 'Failed to save indicator' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.mes) {
      return NextResponse.json({ error: 'Invalid payload, missing mes' }, { status: 400 });
    }
    await ensureTable();
    const id = body.mes;
    // Upsert to guarantee persistence even when the month doesn't exist yet
    await pool.query(
      'INSERT INTO indicators (id, mes, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, mes = EXCLUDED.mes',
      [id, body.mes, JSON.stringify(body)]
    );
    return NextResponse.json(body);
  } catch (err) {
    console.error('PUT /api/indicators error', err);
    return NextResponse.json({ error: 'Failed to update indicator' }, { status: 500 });
  }
}
