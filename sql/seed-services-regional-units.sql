-- Seeds: replace current `services` rows with a curated set
BEGIN;

-- remove existing data (events/checklist depend on services -> cascade if FK configured)
DELETE FROM service_events;
DELETE FROM service_checklist;
DELETE FROM services;

-- insert corrected services across the 4 regionals and example strategic units
INSERT INTO services (id, title, location, status, status_reason, owner, dependency, next_action, next_followup_date, status_since, last_update, unlock_what, regional, unit)
VALUES
  ('srv-01-001','Troca de compressor','Loja 12','Em andamento','Equipe em campo','Equipe Alfa','Interno','Cobrar peças','2026-02-09','2026-02-08',now(),NULL,'Regional 01','Refrigeracao'),
  ('srv-02-001','Painel eletrico com risco','CD 02','Travado','Bloqueio de acesso','Equipe Beta','Loja','Liberar acesso','2026-02-10','2026-02-02',now(),'Liberacao formal da area','Regional 02','Energia'),
  ('srv-03-001','Falha em iluminacao externa','Loja 03','Critico','Area sem iluminacao','Equipe Delta','Fornecedor','Aguardar entrega','2026-02-11','2026-02-05',now(),'Entrega de luminarias','Regional 03','Infraestrutura'),
  ('srv-04-001','Inspecao HVAC','Loja 20','Em andamento','Agendado','Equipe Gama','Interno','Validar checklist','2026-02-12','2026-02-10',now(),NULL,'Regional 04','Climatizacao'),
  ('srv-05-001','Teste split unidade','Loja 05','Em andamento','Aguardando pecas','Equipe Zeta','Fornecedor','Confirmar entrega','2026-02-13','2026-02-11',now(),NULL,'Regional 01','Climatizacao');

COMMIT;

-- Quick verification
-- SELECT id,title,regional,unit FROM services ORDER BY last_update DESC LIMIT 50;
