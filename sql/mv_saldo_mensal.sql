-- sql/mv_saldo_mensal.sql
-- Materialized view with monthly saldo (credit positive, debit negative)

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_saldo_mensal AS
SELECT
  date_trunc('month', data_lancamento)::date AS mes,
  sum(CASE WHEN tipo = 'DEBIT' THEN -valor ELSE valor END) AS saldo_mes
FROM public.lancamentos_mensais
GROUP BY 1
ORDER BY 1;

-- Create unique index on mes to allow CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_saldo_mensal_mes ON public.mv_saldo_mensal (mes);

-- You can refresh with:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_saldo_mensal;
-- or (if your Postgres version or permissions don't allow CONCURRENTLY):
-- REFRESH MATERIALIZED VIEW public.mv_saldo_mensal;

-- Add an index to speed lookups by mes (already unique). If you want to query by range, add additional indexes as needed.

-- Optional: grant select to application role
-- GRANT SELECT ON public.mv_saldo_mensal TO aplicacao_role;

-- EOF
