# Demonstração de Componentes

Resumo rápido: esta pasta contém uma página de demonstração que apresenta implementações interativas simples de vários componentes úteis para aplicações internas.

**Componentes demonstrados:**
- **Quadro Kanban**: gestão visual de tarefas (A Fazer / Em Andamento / Concluído).
- **Gráfico de Gantt**: visualização de cronograma e prazos.
- **Tabela de Dados Avançada**: filtragem e paginação simples demonstradas.
- **Linha do Tempo (Timeline)**: histórico cronológico de eventos.
- **Organograma**: representação hierárquica básica.
- **Mapa de Calor (Heatmap)**: visualização de intensidade de valores.
- **Assistente (Wizard/Stepper)**: fluxo multi-etapas com navegação.

**Onde está:**
- Página de demonstração (rodando dentro do app shell): [src/app/(app-shell)/components-demo/page.tsx](src/app/(app-shell)/components-demo/page.tsx#L1)

**Como executar localmente:**
1. Inicie a aplicação em modo dev:

```bash
npm run dev
```

2. Abra no navegador:

```
http://localhost:9002/components-demo
```

**Observações importantes:**
- Os demos atuais são implementados inline em `src/app/(app-shell)/components-demo/page.tsx` para facilitar iteração rápida.
- Se quiser componentes reutilizáveis na árvore `src/components/ui/`, eu posso extrair cada demo para arquivos separados e adicionar exports.

**Próximos passos recomendados:**
- Extrair demos para `src/components/ui/demo/` (melhora reuso e testes).
- Adicionar testes Vitest simples para cada componente (1 caso feliz + 1 borda).
- Ajustar estilos para seguir o design system do projeto (variáveis de tema, espaçamentos).

Criado automaticamente por atividade do assistente — me diga se quer que eu mova os demos para componentes separados agora.
