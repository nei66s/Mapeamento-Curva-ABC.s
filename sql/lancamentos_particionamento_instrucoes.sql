-- Arquivo: sql/lancamentos_particionamento_instrucoes.sql
-- Objetivo: instruções e passos seguros para migrar uma tabela não-particionada para uma tabela particionada mensalmente.
-- Leia com atenção e execute em um ambiente de testes antes de aplicar em produção.

-- 0) Premissas
-- - A tabela atual é `public.lancamentos_mensais` (não particionada).
-- - Queremos criar `public.lancamentos_mensais` particionada por RANGE (data_lancamento) e mover os dados.
-- - Requer privilégio de superuser/owner do schema para renomear e criar tabelas.

-- 1) Criar tabela particionada nova (com UNIQUE/PK adequados)
BEGIN;

-- Cria a tabela particionada (sem sobrescrever a original)
CREATE TABLE IF NOT EXISTS public.lancamentos_mensais_new (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  PRIMARY KEY (id, data_lancamento)
) PARTITION BY RANGE (data_lancamento);

-- 2) Criar partições para os intervalos que você precisa
-- Exemplo: criar partição para 2025-11
CREATE TABLE IF NOT EXISTS public.lancamentos_mensais_2025_11 PARTITION OF public.lancamentos_mensais_new
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Crie partições para todo o intervalo que contem dados existentes (um por mês).
-- Você pode gerar essas instruções dinamicamente em função do mínimo e máximo de data_lancamento.

-- 3) Criar índices nas partições (exemplo para cada partição criada):
CREATE INDEX IF NOT EXISTS idx_lancamentos_2025_11_data_vencimento ON public.lancamentos_mensais_2025_11 (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_2025_11_metadata_gin ON public.lancamentos_mensais_2025_11 USING gin (metadata jsonb_path_ops);

-- 4) Mover dados da tabela antiga para a nova (faça em blocos para não travar o DB)
-- Exemplo: mover apenas dados de 2025-11
INSERT INTO public.lancamentos_mensais_new
SELECT * FROM public.lancamentos_mensais
WHERE data_lancamento >= '2025-11-01' AND data_lancamento < '2025-12-01';

-- Repita para cada partição/intervalo. Para grandes volumes, use COPY TO / COPY FROM em arquivos intermediários.

-- 5) Verificar contagens antes de apagar
SELECT count(*) AS origem_total FROM public.lancamentos_mensais;
SELECT count(*) AS destino_total FROM public.lancamentos_mensais_new;

-- 6) Trocar nomes (apenas quando estiver seguro)
-- Renomear tabela original para backup e renomear a nova para o nome original.
ALTER TABLE public.lancamentos_mensais RENAME TO lancamentos_mensais_old;
ALTER TABLE public.lancamentos_mensais_new RENAME TO lancamentos_mensais;

-- 7) Recriar triggers/funcões/constraints necessárias no novo parent ou nas partições conforme necessário
-- Exemplo: trigger de updated_at
CREATE OR REPLACE FUNCTION trg_set_timestamp_updated_at_new()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Criar trigger nas partições ou em um template para aplicar quando criar novas partições
-- (você pode criar uma função para criar partições que já crie os índices e trigger automaticamente)

COMMIT;

-- 8) Papel do DBA
-- - Teste em staging.
-- - Planeje janela de manutenção para o passo 6 (rename), se houver atividade concorrente.
-- - Após confirmar, remova a tabela de backup `lancamentos_mensais_old` quando tiver certeza.

-- 9) Se quiser, eu posso gerar um script mais completo que:
--   * detecta o range de datas existentes
--   * gera as CREATE TABLE PARTITION statements para cada mês
--   * cria índices em cada partição
--   * move os dados em blocos (ex: por mês)
-- Me avise se quer que eu gere esse script automatizado.

-- 10) Observação sobre roles/grants: se executou 'GRANT ... TO aplicacao_role' e a role não existe, crie-a:
-- CREATE ROLE aplicacao_role NOLOGIN;
-- ou substitua pelo role existente do seu sistema.

-- FIM
