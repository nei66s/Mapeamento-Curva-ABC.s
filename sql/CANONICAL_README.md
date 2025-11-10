# SQL canonical directory

Este diretório (`sql/`) contém a fonte de verdade para scripts SQL do projeto.

Motivação:
- O repositório tinha scripts repetidos entre `scripts/` e o root. Para evitar inconsistências, criamos cópias canonizadas aqui.

Como usar:
- Preferir executar arquivos a partir de `sql/` (ex.: `psql -d $DB -f sql/seed.sql`).
- Os arquivos originais em `scripts/` e na raiz permanecem por segurança; uma próxima etapa pode remover os duplicados depois de validação.

Arquivos consolidados nesta mudança (exemplos):
- `apply-indexes.sql`  (original: `scripts/apply-indexes.sql`)
- `migrate-rncs.sql`  (original: `scripts/migrate-rncs.sql`)
- `migrate-add-category-fields.sql` (original: `scripts/migrate-add-category-fields.sql`)
- `list-unused-tables.sql` (original: `scripts/list-unused-tables.sql`)
- `drop-unused-by-whitelist.sql` (original: `scripts/drop-unused-by-whitelist.sql`)
- `seed.sql` (original: root `seed.sql`)

Próximos passos recomendados:
1. Rodar verificações locais (psql em banco de dev) para garantir que os SQLs funcionam a partir de `sql/`.
2. Atualizar scripts Node/PowerShell para apontar para `sql/` como fonte de verdade (opcional — pode ser feito em PR separado).
3. Após validação, remover duplicados antigos em `scripts/` e raiz e atualizar `reports/duplicate-files.md`.
