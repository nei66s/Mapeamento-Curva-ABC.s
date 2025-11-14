#!/usr/bin/env ts-node
import pool from '../src/lib/db';

async function build() {
  const aggSql = `
    SELECT to_char(data_lancamento, 'YYYY-MM') as mes,
      count(*) as total,
      count(*) FILTER (WHERE status = 'PAGO') as pagos,
      count(*) FILTER (WHERE status = 'PENDENTE') as pendentes
    FROM public.indicadores_lancamentos
    WHERE (metadata->>'seed') IS DISTINCT FROM 'true'
    GROUP BY mes
    ORDER BY mes;
  `;

  const client = await pool.connect();
  try {
    const res = await client.query(aggSql);
    if (!res.rows || res.rows.length === 0) {
      console.log('No aggregated rows found in indicadores_lancamentos');
      return;
    }

    await client.query('BEGIN');
    // ensure indicators table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS indicators (
        id TEXT PRIMARY KEY,
        mes TEXT NOT NULL,
        data JSONB NOT NULL
      );
    `);

    for (const r of res.rows) {
      const mes = r.mes;
      const total = Number(r.total || 0);
      const pagos = Number(r.pagos || 0);
      const pendentes = Number(r.pendentes || 0);
  const sla_mensal = total > 0 ? Math.round((pagos / total) * 100) : 0;
      // compute aging buckets and criticidade breakdown from pending rows
      const pendingSql = `
        SELECT data_lancamento, valor
        FROM public.indicadores_lancamentos
        WHERE to_char(data_lancamento, 'YYYY-MM') = $1
          AND status = 'PENDENTE'
          AND (metadata->>'seed') IS DISTINCT FROM 'true'
      `;
      const pendRes = await client.query(pendingSql, [mes]);
      const now = new Date();

      type AgeKey = 'inferior_30' | 'entre_30_60' | 'entre_60_90' | 'superior_90';
      type CritKey = 'muito_alta' | 'alta' | 'media' | 'baixa';
      const aging: Record<AgeKey, number> = { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 };
      const criticidade: Record<CritKey, number> = { muito_alta: 0, alta: 0, media: 0, baixa: 0 };
      const aging_by_criticidade: Record<CritKey, Record<AgeKey, number>> = {
        muito_alta: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
        alta: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
        media: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
        baixa: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
      };

      for (const p of pendRes.rows) {
        const dl = p.data_lancamento ? new Date(p.data_lancamento) : null;
        const valor = Number(p.valor || 0);
        let ageDays = 0;
        if (dl) {
          ageDays = Math.floor((now.getTime() - dl.getTime()) / (1000 * 60 * 60 * 24));
        }

        let bucket = 'inferior_30';
        if (ageDays >= 90) bucket = 'superior_90';
        else if (ageDays >= 60) bucket = 'entre_60_90';
        else if (ageDays >= 30) bucket = 'entre_30_60';

  aging[bucket as AgeKey] = (aging[bucket as AgeKey] || 0) + 1;

        // derive criticidade by value using shared thresholds
          let crit: CritKey = 'baixa';
          if (valor >= thresholds.muito_alta) crit = 'muito_alta';
          else if (valor >= thresholds.alta) crit = 'alta';
          else if (valor >= thresholds.media) crit = 'media';

        criticidade[crit as CritKey] = (criticidade[crit as CritKey] || 0) + 1;
        aging_by_criticidade[crit as CritKey][bucket as AgeKey] = (aging_by_criticidade[crit as CritKey][bucket as AgeKey] || 0) + 1;
      }

      // Transform aging_by_criticidade (crit -> buckets) into the UI-expected shape
      // Aging should be: { inferior_30: {baixa,media,alta,muito_alta}, ... }
      const aging_ui: Record<AgeKey, Record<CritKey, number>> = {
        inferior_30: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
        entre_30_60: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
        entre_60_90: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
        superior_90: { baixa: 0, media: 0, alta: 0, muito_alta: 0 },
      };
      for (const crit of Object.keys(aging_by_criticidade) as CritKey[]) {
        for (const age of Object.keys(aging_by_criticidade[crit]) as AgeKey[]) {
          aging_ui[age][crit] = aging_by_criticidade[crit][age] || 0;
        }
      }

      const payload = {
        id: mes,
        mes,
        aging: aging_ui,
        aging_by_criticidade,
        backlog: pendentes,
        meta_sla: 80,
        prioridade: { alta: 0, baixa: 0, media: 0, muito_alta: 0 },
        sla_mensal,
        criticidade,
        r2_tendencia: 0,
        chamados_abertos: total,
        chamados_solucionados: pagos,
        crescimento_mensal_sla: 0,
  // costs removed from payload
      };

      await client.query(
        `INSERT INTO indicators (id, mes, data) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, mes = EXCLUDED.mes`,
        [mes, mes, JSON.stringify(payload)]
      );
    }

    await client.query('COMMIT');
    console.log(`Rebuilt indicators table with ${res.rows.length} months`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error building indicators:', err);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

import { CRIT_THRESHOLDS as thresholds } from '../src/lib/criticidade.config';

build().catch(e => { console.error(e); process.exit(1); });
