# Escopo de Evolução e MVP (`mvp.md`)

Este documento distingue claramente o que faz parte desta **Etapa 1 (Fundação Técnica)** e o que será construído progressivamente nas próximas etapas rumo ao MVP completo.

---

## 1. Entregue na Etapa 1 — Fundação Técnica (Atual)

- Monorepositório npm Workspaces configurado e validado (`apps/web`, `apps/api`, `packages/design-tokens`, `packages/editor-core`, `packages/shared-types`).
- Pesquisa documentada das fontes oficiais da Apple e definição de licenciamento seguro de fontes e ícones.
- 8 Skills do Antigravity (`.agents/skills/*/SKILL.md`) e regras permanentes (`AGENTS.md`).
- Design System inicial com tokens semânticos, temas Claro e Escuro e componentes base (`Icon`, `Button`, `Input`, `Tabs`, `Panel`, `Toolbar`, `Badge`, `Tooltip`, `Dialog`).
- Interface estrutural do editor com Barra Superior, Navegação Lateral, Área Central do Canvas (com adaptador inicial `Fabric.js` isolado e ciclo seguro de mount/cleanup) e Painel Inspetor de Propriedades.
- Núcleo conceitual `@pencel/editor-core` com tipos de documento, página, elementos, presets e serialização JSON versionada.
- API Express mínima com validação de ambiente, rota `/api/v1/health` e tratamento de erros.
- Suíte de testes automatizados (Vitest), lint (ESLint), formatação (Prettier) e pipeline de CI (GitHub Actions).

---

## 2. Planejado para as Próximas Etapas (Não Simulado na Etapa 1)

- **Etapa 2 — Manipulação Interativa no Canvas:** Criação, seleção, movimentação, redimensionamento e rotação bidirecional de formas e textos sincronizados com `@pencel/editor-core`.
- **Etapa 3 — Histórico Completo e Comandos:** Pilha funcional de `Undo/Redo`, duplicação, exclusão, ordenação de camadas (`z-index`) e atalhos de teclado.
- **Etapa 4 — Tipografia e Ativos de Imagem:** Edição rica de texto no canvas, upload local seguro de imagens e catálogo inicial de composições próprias.
- **Etapa 5 — Exportação e Persistência:** Exportação real para PNG/JPG/SVG/JSON e integração opcional com PostgreSQL na API para salvamento de projetos.
