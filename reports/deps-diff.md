Diff e recomendações entre `package.json` (root) e `src/package.json`

Resumo

- `root` (c:\Users\neiol\OneDrive\Desktop\Mapeamento-Curva-ABC\package.json)
- `src`  (c:\Users\neiol\OneDrive\Desktop\Mapeamento-Curva-ABC\src\package.json)

Principais diferenças encontradas (varredura inicial)

1) Versão do Next
- root: "next": "^16.0.2-canary.10"
- src:  "next": "15.3.3"

Risco: incompatibilidades de build / features. Alinhar para uma única versão. Recomendo usar a versão suportada pela infra e equipe; se optar por canary/experimental, documente as consequências.

2) `pg` (Postgres client)
- Presente em: root `package.json` ("pg": "^8.16.3")
- Não presente em: `src/package.json`

Observação: o código em `src/` utiliza `pg` (e.g., `src/lib/db.ts`). Se `npm install` for executado apenas no `src/` em algum fluxo, `pg` pode faltar. Se o app é instalado a partir do root (provável), manter `pg` no root é suficiente.

3) Dependências presentes só em `src` (exemplos)
- "@dnd-kit/core": "^6.1.0"
- "@dnd-kit/sortable": "^8.0.0"

Se essas libs são usadas pela app em `src/`, mover para o `package.json` raiz garante que estejam disponíveis quando a app for instalada a partir do root.

4) Dependências duplicadas com versões alinhadas
- Muitas libs (e.g., @genkit-ai/*, @radix-ui/*, react, react-dom, zod) aparecem em ambos com versões compatíveis — OK, mas aumenta manutenção.

Recomendações práticas

Opção 1 — Single-app (consolidar)
- Mover dependências necessárias de `src/package.json` para o `package.json` da raiz.
- Remover `src/package.json` (simples e reduz confusão).
- Manter um único lockfile (`package-lock.json`) no root.

Opção 2 — Monorepo
- Adotar workspaces (npm/yarn/pnpm) e transformar `src/` e `scripts/` em packages com seus próprios package.json, e adicionar um `package.json` raiz com `workspaces` configurado.

Ação tomada nesta execução

- Adicionei dependências faltantes do `src/package.json` ao `package.json` raiz quando apropriado.
- Não forcei mudança na versão do `next` — mantive a versão já declarada no root (canary). Recomendo revisar e confirmar a versão alvo.

Próximos passos sugeridos

- Escolha entre Opção 1 (consolidação) ou Opção 2 (monorepo). Se optar por consolidação, eu posso:
  - mover dependências do `src/package.json` para o root,
  - remover `src/package.json`,
  - remover lockfiles duplicados em subpastas,
  - abrir uma branch com as mudanças e commitar.

- Se optar por monorepo, eu posso ajudar a criar a configuração de workspaces e ajustar CI.
