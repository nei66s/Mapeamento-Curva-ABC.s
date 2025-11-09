Relatório de arquivos duplicados (varredura inicial)

Resumo

Esta é uma lista inicial de arquivos que aparecem mais de uma vez no repositório por nome base (basename). Nem todas as duplicações são problemáticas (por exemplo, muitos `page.tsx` e `route.ts` são normais em apps Next). Aponto as duplicações que merecem atenção e uma recomendação curta para cada uma.

1) package.json
- c:\\Users\\neiol\\OneDrive\\Desktop\\Mapeamento-Curva-ABC\\package.json
- c:\\Users\\neiol\\OneDrive\\Desktop\\Mapeamento-Curva-ABC\\src\\package.json
- c:\\Users\\neiol\\OneDrive\\Desktop\\Mapeamento-Curva-ABC\\scripts\\package.json

Recomendação: decidir se o repositório é single-app ou monorepo. Se for single-app, remover/mesclar os manifests `src/package.json` e `scripts/package.json` dentro do `package.json` raiz. Se for monorepo, adotar workspaces (npm/yarn/pnpm) e documentar escopos.

2) package-lock.json
- c:\\Users\\neiol\\OneDrive\\Desktop\\Mapeamento-Curva-ABC\\package-lock.json
- c:\\Users\\neiol\\OneDrive\\Desktop\\Mapeamento-Curva-ABC\\scripts\\package-lock.json

Recomendação: manter apenas os lockfiles necessários. Lockfiles duplicados indicam instalações separadas e podem causar divergência de dependências.

3) README.md
- c:\\Users\\neiol\\OneDrive\\Desktop\\Mapeamento-Curva-ABC\\README.md
- c:\\Users\\neiol\\OneDrive\\Desktop\\Mapeamento-Curva-ABC\\scripts\\README.md

Recomendação: manter documentação localizada e referenciar sub-readmes apenas quando necessários.

4) SQLs duplicados (exemplos)
- `seed.sql` aparece em root (root/seed.sql)
- `apply-indexes.sql`, `migrate-rncs.sql`, `migrate-add-category-fields.sql`, `list-unused-tables.sql` aparecem sob `scripts/` e `sql/`.

Recomendação: escolher `sql/` ou `scripts/` como fonte de verdade, mover/renomear e atualizar scripts que referenciam os caminhos antigos.

5) page.tsx / route.ts
- Muitos `page.tsx` e `route.ts` sob `src/app/**` — isto é esperado (Next app router). Não considerar como bug a menos que haja rotas duplicadas que conflitam na mesma rota URL.

Observações finais
- Arquivos com mesmo nome não são automaticamente um problema; priorize:
  1) arquivos de configuração (package.json, lockfiles, tsconfig.*, next.config.*)
  2) scripts e assets infra-criticos (SQL, seeds)
  3) duplicações de código-fonte com conteúdo diferente (necessária revisão manual)

Posso gerar um CSV com todas as duplicações por basename e caminhos completos se quiser — isso facilita revisão em massa.

Atualização (ações aplicadas):

- Copiei os SQLs listados para `sql/` como fonte canônica nesta branch (`sql/apply-indexes.sql`, `sql/migrate-rncs.sql`, `sql/migrate-add-category-fields.sql`, `sql/list-unused-tables.sql`, `sql/drop-unused-by-whitelist.sql`, `sql/seed.sql`).
- Os arquivos originais em `scripts/` e na raiz foram mantidos por segurança. Próximo passo recomendado: atualizar os scripts que chamam os caminhos antigos para apontar para `sql/` e, após validação, remover os duplicados.

Se quiser, eu faço um commit adicional atualizando os scripts JS/PS1 para usar `sql/` como fonte de verdade (opção segura: criar um helper `scripts/sync-sql-to-sqldir.js` em vez de mover imediatamente). 
