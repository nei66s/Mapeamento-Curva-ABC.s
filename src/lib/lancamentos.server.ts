import pool from './db';
import { CRIT_THRESHOLDS as thresholds } from './criticidade.config';

type SyncResult = {
  total: number;
  inserted: number;
  updated: number;
};

export async function ensureIndicadoresTableExists() {
  // Cria uma tabela enxuta para armazenar os dados usados pela página de indicadores.
  // Mantemos tipos compatíveis com a tabela de origem quando possível.
  const sql = `
    CREATE TABLE IF NOT EXISTS public.indicadores_lancamentos (
      id uuid PRIMARY KEY,
      conta_id uuid,
      categoria_id uuid,
      tipo lancamento_tipo,
      descricao text,
      valor numeric(14,2),
      moeda char(3),
      data_lancamento date,
      data_vencimento date,
      status lancamento_status,
      metadata jsonb,
      created_at timestamptz,
      updated_at timestamptz,
      referencia text
    );
  `;
  await pool.query(sql);
}

export async function syncLancamentos(opts?: { since?: string }): Promise<SyncResult> {
  await ensureIndicadoresTableExists();

  const params: any[] = [];
  let where = '';
  if (opts && opts.since) {
    where = 'WHERE data_lancamento >= $1';
    params.push(opts.since);
  }

  // Busca dados da tabela de origem (assumimos `public.lancamentos_mensais` como fonte)
  const selectSql = `
    SELECT id, conta_id, categoria_id, tipo, descricao, valor, moeda,
           data_lancamento, data_vencimento, status, metadata, created_at, updated_at, referencia
    FROM public.lancamentos_mensais
    ${where}
  `;

  const res = await pool.query(selectSql, params);
  const rows = res.rows || [];

  if (rows.length === 0) {
    return { total: 0, inserted: 0, updated: 0 };
  }

  // Upsert em lote dentro de transação
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    let updated = 0;

    const insertSql = `
      INSERT INTO public.indicadores_lancamentos (
        id, conta_id, categoria_id, tipo, descricao, valor, moeda,
        data_lancamento, data_vencimento, status, metadata, created_at, updated_at, referencia
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
      ON CONFLICT (id) DO UPDATE SET
        conta_id = EXCLUDED.conta_id,
        categoria_id = EXCLUDED.categoria_id,
        tipo = EXCLUDED.tipo,
        descricao = EXCLUDED.descricao,
        valor = EXCLUDED.valor,
        moeda = EXCLUDED.moeda,
        data_lancamento = EXCLUDED.data_lancamento,
        data_vencimento = EXCLUDED.data_vencimento,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        referencia = EXCLUDED.referencia
      RETURNING (xmax = 0) as inserted_flag;
    `;

    for (const r of rows) {
      const vals = [
        r.id,
        r.conta_id,
        r.categoria_id,
        r.tipo,
        r.descricao,
        r.valor,
        r.moeda,
        r.data_lancamento,
        r.data_vencimento,
        r.status,
        r.metadata || null,
        r.created_at || null,
        r.updated_at || null,
        r.referencia || null,
      ];
      const out = await client.query(insertSql, vals);
      // inserted_flag = true quando a linha foi inserida (xmax = 0 indica insert)
      if (out && out.rows && out.rows[0] && out.rows[0].inserted_flag) inserted++;
      else updated++;
    }

    await client.query('COMMIT');
    return { total: rows.length, inserted, updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getIndicadores(limit = 100) {
  // Função simples para a página indicadores consumir os dados já sincronizados
  const sql = `
    SELECT id, conta_id, categoria_id, tipo, descricao, valor, moeda,
           data_lancamento, data_vencimento, status, metadata, created_at, updated_at, referencia
    FROM public.indicadores_lancamentos
    ORDER BY data_lancamento DESC, id
    LIMIT $1
  `;
  const res = await pool.query(sql, [limit]);
  return res.rows || [];
}

export async function buildIndicators() {
  // Aggregate `indicadores_lancamentos` into `indicators` table (same logic as scripts/build-indicators.ts)
  const aggSql = `
    SELECT to_char(data_lancamento, 'YYYY-MM') as mes,
           count(*) as total,
           count(*) FILTER (WHERE status = 'PAGO') as pagos,
           count(*) FILTER (WHERE status = 'PENDENTE') as pendentes,
           coalesce(sum(valor),0) as soma_valor
    FROM public.indicadores_lancamentos
    GROUP BY mes
    ORDER BY mes;
  `;

  const client = await pool.connect();
  try {
    const res = await client.query(aggSql);
    if (!res.rows || res.rows.length === 0) {
      return { months: 0 };
    }

    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS indicators (
        id TEXT PRIMARY KEY,
        mes TEXT NOT NULL,
        data JSONB NOT NULL
      );
    `);

    const now = new Date();

    for (const r of res.rows) {
      const mes = r.mes;
      const total = Number(r.total || 0);
      const pagos = Number(r.pagos || 0);
      const pendentes = Number(r.pendentes || 0);
      const soma_valor = Number(r.soma_valor || 0);

      const sla_mensal = total > 0 ? Math.round((pagos / total) * 100) : 0;

      const pendingSql = `
        SELECT data_lancamento, valor
        FROM public.indicadores_lancamentos
        WHERE to_char(data_lancamento, 'YYYY-MM') = $1
          AND status = 'PENDENTE'
      `;
      const pendRes = await client.query(pendingSql, [mes]);

      type AgeKey = 'inferior_30' | 'entre_30_60' | 'entre_60_90' | 'superior_90';
      type CritKey = 'muito_alta' | 'alta' | 'media' | 'baixa';
      const aging_by_criticidade: Record<CritKey, Record<AgeKey, number>> = {
        muito_alta: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
        alta: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
        media: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
        baixa: { inferior_30: 0, entre_30_60: 0, entre_60_90: 0, superior_90: 0 },
      };
      const criticidade: Record<CritKey, number> = { muito_alta: 0, alta: 0, media: 0, baixa: 0 };

      for (const p of pendRes.rows) {
        const dl = p.data_lancamento ? new Date(p.data_lancamento) : null;
        const valor = Number(p.valor || 0);
        let ageDays = 0;
        if (dl) ageDays = Math.floor((now.getTime() - dl.getTime()) / (1000 * 60 * 60 * 24));

        let bucket: AgeKey = 'inferior_30';
        if (ageDays >= 90) bucket = 'superior_90';
        else if (ageDays >= 60) bucket = 'entre_60_90';
        else if (ageDays >= 30) bucket = 'entre_30_60';

  // derive criticidade by value using shared thresholds
  let crit: CritKey = 'baixa';
  if (valor >= thresholds.muito_alta) crit = 'muito_alta';
  else if (valor >= thresholds.alta) crit = 'alta';
  else if (valor >= thresholds.media) crit = 'media';

        criticidade[crit] = (criticidade[crit] || 0) + 1;
        aging_by_criticidade[crit][bucket] = (aging_by_criticidade[crit][bucket] || 0) + 1;
      }

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
        soma_valor,
      };

      await client.query(
        `INSERT INTO indicators (id, mes, data) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, mes = EXCLUDED.mes`,
        [mes, mes, JSON.stringify(payload)]
      );
    }

    await client.query('COMMIT');
    return { months: res.rows.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default {
  ensureIndicadoresTableExists,
  syncLancamentos,
  getIndicadores,
};
