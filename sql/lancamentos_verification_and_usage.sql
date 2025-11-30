-- Arquivo: sql/lancamentos_verification_and_usage.sql
-- Objetivo: comandos de verificação e instruções de uso do psql no PowerShell
-- Substitua HOST, USER, DB pelos valores do seu ambiente (sem < >).

psql -h localhost -U mapeamento_user -d mapeamento -c "SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','uuid-ossp');"
-- Use valores reais, por exemplo HOST=localhost USER=mapeamento_user DB=mapeamento
-- - Substitua pelos valores reais ou use variáveis do PowerShell:
--   $HOST = 'localhost'; $USER = 'mapeamento_user'; $DB = 'mapeamento'; psql -h $HOST -U $USER -d $DB -c "SELECT 1;"
psql -h HOST -U USER -d DB -c '\d+ public.lancamentos_mensais'

-- 3) Contagem de linhas e visualização rápida
psql -h HOST -U USER -d DB -c "SELECT count(*) FROM public.lancamentos_mensais;"
psql -h HOST -U USER -d DB -c "SELECT * FROM public.lancamentos_mensais ORDER BY created_at DESC LIMIT 10;"

-- 4) Listar índices criados
psql -h HOST -U USER -d DB -c "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='lancamentos_mensais';"

-- 5) Ver triggers definidos para a tabela
psql -h HOST -U USER -d DB -c "SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.lancamentos_mensais'::regclass;"
psql -h HOST -U USER -d DB -c "SELECT proname, prosrc FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE proname ILIKE 'trg_set_timestamp%';"

-- 6) Verificar partições (se aplicável)
psql -h HOST -U USER -d DB -c "SELECT inhrelid::regclass AS partition, inhparent::regclass AS parent FROM pg_inherits WHERE inhparent = 'public.lancamentos_mensais'::regclass;"

-- 7) Observações sobre PowerShell e placeholders
-- - Nunca utilize os sinais angulares <host> no PowerShell: o caractere '<' é interpretado pelo parser.
-- - Substitua pelos valores reais ou use variáveis do PowerShell:
--   $HOST = 'localhost'; $USER = 'postgres'; $DB = 'mydb'; psql -h $HOST -U $USER -d $DB -c "SELECT 1;"
-- - Para executar metacomandos do psql (\d, \copy), abra o prompt interativo do psql:
--   psql -h HOST -U USER -d DB
--   \d+ public.lancamentos_mensais
--   \copy public.lancamentos_mensais(...) FROM 'C:\caminho\lancamentos.csv' WITH (FORMAT csv, HEADER true);

-- 8) Sobre \copy: é um comando do cliente psql. Se tentar rodar no PowerShell sem abrir o prompt, receberá erro.
--    Abra psql primeiro (psql -h HOST -U USER -d DB), então execute o \copy dentro do prompt.

-- 9) Como criar um role caso precise (execute com um superuser):
-- CREATE ROLE aplicacao_role NOLOGIN;
-- GRANT SELECT, INSERT, UPDATE ON public.lancamentos_mensais TO aplicacao_role;

-- 10) Se quiser rodar vários comandos SQL de verificação em sequência, salve este arquivo e execute:
-- psql -h HOST -U USER -d DB -f .\sql\lancamentos_verification_and_usage.sql

-- FIM
