-- lancamentos_ddl_fixed.sql
-- Execute este arquivo em uma database existente (ex: mapeamento).
-- 0. Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tipos ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lancamento_tipo') THEN
    CREATE TYPE lancamento_tipo AS ENUM ('DEBIT', 'CREDIT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lancamento_status') THEN
    CREATE TYPE lancamento_status AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');
  END IF;
END$$;

-- 2. Tabela principal (não particionada)
CREATE TABLE IF NOT EXISTS public.lancamentos_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid,
  categoria_id uuid,
  tipo lancamento_tipo NOT NULL,
  descricao text,
  valor numeric(14,2) NOT NULL CHECK (valor <> 0),
  moeda char(3) NOT NULL DEFAULT 'BRL',
  data_lancamento date NOT NULL,
  data_vencimento date,
  recorrente boolean NOT NULL DEFAULT false,
  recorrencia_rule text,
  status lancamento_status NOT NULL DEFAULT 'PENDENTE',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  referencia text,
  CONSTRAINT chk_moeda_len CHECK (char_length(moeda)=3)
);

-- 3. Índices úteis
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_lancamento ON public.lancamentos_mensais (data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_vencimento ON public.lancamentos_mensais (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_id ON public.lancamentos_mensais (conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON public.lancamentos_mensais (status);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data_id_desc ON public.lancamentos_mensais (data_lancamento DESC, id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_metadata_gin ON public.lancamentos_mensais USING gin (metadata jsonb_path_ops);

-- 4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.trg_set_timestamp_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_timestamp_on_update ON public.lancamentos_mensais;
CREATE TRIGGER set_timestamp_on_update
BEFORE UPDATE ON public.lancamentos_mensais
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_timestamp_updated_at();

-- 5. Partial index example
CREATE INDEX IF NOT EXISTS idx_lancamentos_vencendo_pendentes ON public.lancamentos_mensais (data_vencimento)
WHERE status = 'PENDENTE' AND data_vencimento IS NOT NULL;

-- 6. Exemplos de inserts (opcionais). Comentados por padrão.
-- INSERT INTO public.lancamentos_mensais (conta_id, categoria_id, tipo, descricao, valor, moeda, data_lancamento, data_vencimento, recorrente, status, metadata, created_by, referencia) VALUES
--   (gen_random_uuid(), gen_random_uuid(), 'DEBIT', 'Pagamento fornecedor X', 1500.00, 'BRL', '2025-11-01', '2025-11-10', false, 'PENDENTE', '{"fornecedor":"Fornecedor X","nota":"NF-123"}', gen_random_uuid(), 'NF-123');

-- 7. Recomendações: veja 'sql/lancamentos_particionamento_instrucoes.sql' para migrar para particionamento mensal se necessário.

-- EOF
